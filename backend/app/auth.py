import os
import argparse
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Header
from app.errors import APIError


def _setting(name, default=""):
    value = os.environ.get(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value


def settings():
    secret = _setting("WAVELENGTH_JWT_SECRET")
    if len(secret.encode()) < 32 or len(set(secret)) < 12:
        raise RuntimeError(
            "WAVELENGTH_JWT_SECRET must be a strong secret of at least 32 bytes"
        )
    if os.environ.get("WAVELENGTH_TEST_AUTH"):
        raise RuntimeError("Test authentication is not supported by this server")
    return (
        secret,
        _setting("WAVELENGTH_JWT_ISSUER", "wavelength-local"),
        _setting("WAVELENGTH_JWT_AUDIENCE", "wavelength-api"),
    )


def identity(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise APIError(401, "unauthorized", "A bearer token is required")
    try:
        secret, issuer, audience = settings()
        payload = jwt.decode(
            authorization[7:],
            secret,
            algorithms=["HS256"],
            issuer=issuer,
            audience=audience,
            options={"require": ["sub", "iss", "aud", "exp"]},
        )
        if not isinstance(payload["sub"], str) or not payload["sub"].strip():
            raise ValueError()
        return payload["sub"]
    except (jwt.PyJWTError, ValueError):
        raise APIError(401, "unauthorized", "The bearer token is invalid or expired")


def main():
    parser = argparse.ArgumentParser(
        description="Issue a local single-user server-to-server token; never expose it in browser code"
    )
    parser.add_argument("--subject", required=True)
    parser.add_argument("--hours", type=int, default=24)
    args = parser.parse_args()
    if not 1 <= args.hours <= 168:
        parser.error("--hours must be between 1 and 168")
    secret, issuer, audience = settings()
    print(
        jwt.encode(
            dict(
                sub=args.subject,
                iss=issuer,
                aud=audience,
                exp=datetime.now(timezone.utc) + timedelta(hours=args.hours),
            ),
            secret,
            algorithm="HS256",
        )
    )


if __name__ == "__main__":
    main()
