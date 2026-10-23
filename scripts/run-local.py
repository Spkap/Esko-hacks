"""Start the private local app: python3 scripts/run-local.py [--production]."""

import argparse
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PNPM = shutil.which("pnpm.cmd" if os.name == "nt" else "pnpm") or "pnpm"


def environment():
    path = ROOT / "backend/.env"
    if not path.is_file():
        raise RuntimeError(
            "Create backend/.env using backend/.env.example first; see backend/README.md."
        )
    values = os.environ.copy()
    for line in path.read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def available(port):
    with socket.socket() as connection:
        return connection.connect_ex(("127.0.0.1", port)) != 0


def database_ready(env):
    command = "from app.database import engine; from sqlalchemy import text; c=engine.connect(); c.execute(text('SELECT 1')); c.close()"
    return (
        subprocess.run(
            ["uv", "run", "--frozen", "python", "-c", command],
            cwd=ROOT / "backend",
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode
        == 0
    )


def wait_for(url, process):
    for _ in range(120):
        if process.poll() is not None:
            raise RuntimeError(
                "A service exited during startup; inspect the service output above."
            )
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, ValueError):
            pass
        time.sleep(0.5)
    raise RuntimeError("Service startup exceeded 60 seconds.")


def write_token(env):
    token = subprocess.check_output(
        [
            "uv",
            "run",
            "--frozen",
            "python",
            "-m",
            "app.auth",
            "--subject",
            "local-reviewer",
            "--hours",
            "168",
        ],
        cwd=ROOT / "backend",
        env=env,
        text=True,
    ).strip()
    path = ROOT / "frontend/.env.local"
    updates = {
        "NEXT_PUBLIC_DATA_MODE": "live",
        "WAVELENGTH_API_URL": f"http://127.0.0.1:{env.get('WAVELENGTH_API_PORT', '8000')}",
        "WAVELENGTH_API_TOKEN": token,
    }
    lines = [
        line
        for line in (path.read_text().splitlines() if path.exists() else [])
        if line.split("=", 1)[0] not in updates
    ]
    # Restrictive mode before writing; the bearer never appears in command output.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    os.chmod(path, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        stream.write(
            "\n".join(lines + [f"{key}={value}" for key, value in updates.items()])
            + "\n"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--production", action="store_true", help="Build and serve optimized frontend"
    )
    parser.add_argument(
        "--check", action="store_true", help="Read-only dependency/database checks"
    )
    args = parser.parse_args()
    for command in ("uv", "pnpm", "tesseract"):
        if not shutil.which(command):
            raise RuntimeError(f"Required command is missing: {command}")
    env = environment()
    if not database_ready(env):
        data = env.get("WAVELENGTH_LOCAL_PGDATA")
        if (
            args.check
            or not data
            or not Path(data).is_dir()
            or not shutil.which("pg_ctl")
        ):
            raise RuntimeError(
                "PostgreSQL is unavailable. Start the configured database, or configure WAVELENGTH_LOCAL_PGDATA for an existing local cluster."
            )
        subprocess.run(
            [
                "pg_ctl",
                "-D",
                data,
                "-l",
                str(Path(data).parent / "postgres.log"),
                "start",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        if not database_ready(env):
            raise RuntimeError(
                "Configured PostgreSQL cluster started but database connection failed."
            )
    if args.check:
        print(
            "Dependencies and configured PostgreSQL database are ready. No provider request sent."
        )
        return
    api_port = int(env.get("WAVELENGTH_API_PORT", "8000"))
    if not all(available(port) for port in (api_port, 3000)):
        raise RuntimeError(
            f"Port {api_port} or 3000 is occupied. Stop the existing Wavelength session before starting another; this launcher never stops other services."
        )
    subprocess.run(
        ["uv", "sync", "--frozen"], cwd=ROOT / "backend", env=env, check=True
    )
    subprocess.run(
        ["uv", "run", "--frozen", "alembic", "upgrade", "head"],
        cwd=ROOT / "backend",
        env=env,
        check=True,
    )
    write_token(env)
    frontend_env = dict(os.environ, NEXT_PUBLIC_DATA_MODE="live")
    subprocess.run(
        [PNPM, "install", "--frozen-lockfile"],
        cwd=ROOT / "frontend",
        env=frontend_env,
        check=True,
    )
    if args.production:
        subprocess.run(
            [PNPM, "build"], cwd=ROOT / "frontend", env=frontend_env, check=True
        )
    children = []

    def stop(*_):
        for child in reversed(children):
            if child.poll() is None:
                if os.name == "nt":
                    subprocess.run(
                        ["taskkill", "/PID", str(child.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    os.killpg(child.pid, signal.SIGTERM)
        for child in children:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                if os.name == "nt":
                    child.kill()
                else:
                    os.killpg(child.pid, signal.SIGKILL)

    def interrupted(*_):
        stop()
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:

        def start(command, directory, values):
            process = subprocess.Popen(
                command, cwd=ROOT / directory, env=values, start_new_session=True
            )
            children.append(process)
            return process

        api = start(
            [
                "uv",
                "run",
                "--frozen",
                "uvicorn",
                "app.api.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(api_port),
            ],
            "backend",
            env,
        )
        wait_for(f"http://127.0.0.1:{api_port}/v1/health", api)
        start(["uv", "run", "--frozen", "python", "-m", "app.worker"], "backend", env)
        web = start(
            [PNPM, "start" if args.production else "dev"], "frontend", frontend_env
        )
        wait_for("http://127.0.0.1:3000", web)
        print(
            "Wavelength is ready at http://127.0.0.1:3000. Ctrl-C stops these app services.",
            flush=True,
        )
        while all(child.poll() is None for child in children):
            time.sleep(1)
        raise RuntimeError("A Wavelength service stopped unexpectedly.")
    finally:
        stop()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Cannot start Wavelength: {error}", file=sys.stderr)
        sys.exit(1)
