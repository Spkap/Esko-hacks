"""Database-leased worker. Parsers/rules execute in killable resource-bounded processes."""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import timedelta, timezone
from pathlib import Path
from uuid import uuid4
from sqlalchemy import select, or_, and_
from app.database import Session
from app.models import Review, Run, FileRevision, Check, now
from app.schemas import run_json, CheckOutput

LEASE_SECONDS = 60
MAX_ATTEMPTS = 3
RUN_SECONDS = 300


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def claim():
    with Session.begin() as session:
        row = session.scalar(
            select(Run)
            .where(
                or_(
                    Run.status == "queued",
                    and_(
                        Run.status.in_(["extracting", "checking"]),
                        Run.lease_until < now(),
                    ),
                )
            )
            .order_by(Run.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if not row:
            return None
        if row.attempts >= MAX_ATTEMPTS or (
            row.started_at
            and (now() - utc(row.started_at)).total_seconds() >= RUN_SECONDS
        ):
            row.status = "failed"
            row.error = {
                "code": "timeout",
                "message": "Run exhausted its processing budget",
                "retryable": False,
            }
            row.lease_token = None
            row.lease_until = None
            return None
        row.status = "extracting"
        row.attempts += 1
        row.started_at = row.started_at or now()
        row.lease_token = str(uuid4())
        row.lease_until = now() + timedelta(seconds=LEASE_SECONDS)
        return row.id, row.lease_token


def active(session, run_id, token):
    row = session.scalar(select(Run).where(Run.id == run_id).with_for_update())
    if (
        not row
        or row.lease_token != token
        or row.status not in ("extracting", "checking")
        or not row.lease_until
        or utc(row.lease_until) <= now()
    ):
        raise InterruptedError("Job cancelled or lease replaced")
    if (now() - utc(row.started_at)).total_seconds() >= RUN_SECONDS:
        raise TimeoutError("Five-minute run budget expired")
    return row


def stage(run_id, token, operation, payload):
    # Separate process avoids native-library thread-safety problems and permits actual cancellation.
    environment = {
        k: v
        for k, v in os.environ.items()
        if not any(
            part in k.upper()
            for part in ("SECRET", "TOKEN", "PASSWORD", "DATABASE_URL", "API_KEY", "AI_KEY")
        )
    }
    if operation == "explain":
        # Provider credentials go only to this dedicated process, never document parsers.
        environment["WAVELENGTH_AI_KEY"] = os.environ.get("WAVELENGTH_AI_KEY", "")
    process = subprocess.Popen(
        [sys.executable, "-m", "app.processing", operation],
        cwd=str(Path(__file__).resolve().parents[1]),
        env=environment,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    process.stdin.write(json.dumps(payload))
    process.stdin.close()
    process.stdin = None
    started = time.monotonic()
    try:
        while True:
            try:
                stdout, stderr = process.communicate(timeout=0.5)
                break
            except subprocess.TimeoutExpired:
                with Session.begin() as session:
                    row = active(session, run_id, token)
                    row.lease_until = now() + timedelta(seconds=LEASE_SECONDS)
                if time.monotonic() - started > 120:
                    raise TimeoutError("Reading/checking stage exceeded 120 seconds")
        with Session.begin() as session:
            active(session, run_id, token)
        if process.returncode:
            raise RuntimeError(stderr[-1000:] or "Document processing failed")
        response = json.loads(stdout)
        if not response.get("ok"):
            raise RuntimeError(response.get("error", "Document processing failed"))
        return response["result"]
    finally:
        if process.poll() is None:
            process.kill()
            process.communicate()


def process_job(run_id, token):
    try:
        with Session.begin() as session:
            row = active(session, run_id, token)
            artwork = session.get(FileRevision, row.artwork_id)
            refs = [session.get(FileRevision, ref_id) for ref_id in row.reference_ids]
            payload = dict(
                artwork={
                    "id": artwork.id,
                    "path": artwork.path,
                    "fileType": artwork.file_type,
                },
                references=[
                    dict(
                        id=r.id,
                        path=r.path,
                        fileType=r.file_type,
                        role=r.role,
                        approvalStatus=r.approval_status,
                        title=r.filename,
                    )
                    for r in refs
                ],
            )
        extracted = stage(run_id, token, "extract", payload)
        with Session.begin() as session:
            row = active(session, run_id, token)
            row.status = "checking"
            row.lease_until = now() + timedelta(seconds=LEASE_SECONDS)
            for record_id, extraction in [(row.artwork_id, extracted["artwork"])] + [
                (r["id"], r["extraction"]) for r in extracted["references"]
            ]:
                record = session.get(FileRevision, record_id)
                # Extraction is derived from this immutable file revision; report itself stores its own snapshot.
                record.extraction = extraction
                record.reading_status = extraction.get("readingStatus", "partial")
            run_data = run_json(row)
            review = session.get(Review, row.review_id)
            run_data.update(market=review.market, category=review.category)
        evaluated = stage(run_id, token, "evaluate", dict(**extracted, run=run_data))
        if os.environ.get("WAVELENGTH_AI_ENABLED") == "true":
            evaluated = stage(run_id, token, "explain", evaluated)
        else:
            from app.verification.ai import explain_report

            evaluated = explain_report(evaluated)
        with Session.begin() as session:
            row = active(session, run_id, token)
            for check in evaluated["checks"]:
                check["id"] = str(uuid4())
                check["runId"] = row.id
                check = CheckOutput.model_validate(check).model_dump(exclude_none=True)
                session.add(Check(id=check["id"], run_id=row.id, payload=check))
            row.report = evaluated
            row.status = "completed"
            row.lease_token = None
            row.lease_until = None
    except InterruptedError:
        pass
    except Exception as exc:
        with Session.begin() as session:
            row = session.scalar(select(Run).where(Run.id == run_id).with_for_update())
            if (
                row
                and row.lease_token == token
                and row.status in ("extracting", "checking")
            ):
                row.status = "failed"
                row.error = dict(
                    code="timeout"
                    if isinstance(exc, TimeoutError)
                    else "reading_failure",
                    message=str(exc)[:1000],
                    retryable=False,
                )
                row.lease_token = None
                row.lease_until = None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    while True:
        job = claim()
        if job:
            process_job(*job)
        if args.once:
            return
        if not job:
            time.sleep(1)


if __name__ == "__main__":
    main()
