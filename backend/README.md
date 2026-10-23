# Private Wavelength API and worker

This is a local single-user server-to-server deployment. Bind the API to loopback. The Next.js server owns the bearer token and proxies requests; never use a `NEXT_PUBLIC_` variable for a secret or expose the API publicly. JWTs require HS256, issuer, audience, expiry, and subject; no test authentication bypass exists. A public multi-user deployment needs its own user authentication/session integration and isolated upload infrastructure.

Python 3.11+, uv, PostgreSQL, and Tesseract (with required OCR languages) are needed. From `backend/`:

```sh
uv sync --frozen
export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/wavelength'
export WAVELENGTH_STORAGE_DIR='/absolute/private/wavelength-files'
export WAVELENGTH_JWT_SECRET="$(openssl rand -hex 32)"
export WAVELENGTH_JWT_ISSUER='wavelength-local'
export WAVELENGTH_JWT_AUDIENCE='wavelength-api'
uv run alembic upgrade head
uv run python -m app.auth --subject local-reviewer --hours 24
uv run uvicorn app.api.main:app --host 127.0.0.1 --port 8000
```

Run `uv run python -m app.worker` in a separate terminal with the same environment. `--once` claims at most one job. Set the issued token as the Next.js server's `WAVELENGTH_API_TOKEN`; expired tokens must be reissued. Do not store credentials in tracked files.

Artwork accepts actual PDF, PNG, or JPEG bytes, up to 20 MiB, 20 PDF pages, and 24 megapixels/20,000 pixels per image side. References accept JSON objects, XLSX (bounded expanded size/sheets/cells), or PDF. Request bodies are capped before multipart parsing, including chunked transfer. UUID file paths are private, with a SHA-256 hash per immutable revision. Validation runs in a separate process with a 30-second timeout. Extraction/checking subprocesses have a 120-second stage timeout, CPU limit, and a 1.5 GiB address-space cap on Linux; macOS lacks the address-space limit. Do not claim equivalent production isolation on macOS. No automatic AI provider or legal approval is implied.

Jobs use PostgreSQL row locks/SKIP LOCKED, a renewable 60-second lease, at most three attempts, and a five-minute total budget. An expired job can be reclaimed. Cancellation kills processing at the next lease check (about half a second); final checks/report commit atomically only while the worker owns its lease. Completed results are immutable; decisions append audit rows, with only the latest decision per check returned in the report. Failure detail is available in the run's optional `error` field. Run snapshots fix file revision IDs and selected rule-set version.

Unrun uploaded artworks appear in the list with empty checks, no `latestRunId`, and a synthetic queued placeholder `unrun:<reviewId>` solely for the existing list contract; the UI labels this “No analysis yet”. It is not a queued worker job. Reviews without artwork are accessible through detail but omitted from the dashboard. Listings stream bounded batches and stop after one extra matching item; filtered large-list scans and offset cursors are suitable for this local prototype, not scalable search.

Integration tests require a disposable real PostgreSQL database whose name includes `test` (they delete/recreate its tables):

```sh
DATABASE_URL='postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/wavelength_test' uv run alembic upgrade head
DATABASE_URL='postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/wavelength_test' uv run pytest tests/unit tests/integration tests/evals
```

OpenAPI is exported at `../contracts/openapi.json`; regenerate from `app.api.main.app.openapi()` after contract changes. Integration tests for worker transaction semantics stub only the processing seam; extraction and rule suites and the complete runtime acceptance flow establish actual file reading separately.

## Using a private environment file

You can copy `.env.example` to `.env`, configure it once, and run each command with `uv run --env-file .env ...`. For example:

```sh
uv run --env-file .env alembic upgrade head
uv run --env-file .env uvicorn app.api.main:app --host 127.0.0.1 --port 8000
# Separate terminal, same backend directory:
uv run --env-file .env python -m app.worker
```

The Next bridge rejects non-loopback Host headers and cross-origin mutations; it is not a deployable public login substitute. Database JWT secrets and the server token stay in ignored environment files. The current default processing path uses local extraction and deterministic rules; the optional explanation adapter is separately tested, disabled, and not connected to job evaluation. No external AI calls have been performed.

## Complete local acceptance exercise

With API and worker running, execute `uv run --env-file .env python ../scripts/verify-live.py` from `backend/`. It uploads actual PDFs, checks 330 mL versus 250 mL, reuploads corrected 250 mL, checks file hashes and immutable historical results, tests duplicate request keys, records/reopens a decision, and attempts cross-user document/report access. It creates its own acceptance review in the configured database. Use a disposable database for repeatable automated verification.

### Fireworks prototype configuration

`.env.example` includes an optional Fireworks endpoint and the available Nemotron 3.5 Lightning 30B A3B model. The key belongs only in ignored `.env` (mode 0600), never frontend environment variables. Authentication and model availability were verified using the read-only models endpoint.

As checked on 2026-10-23, [serverless pricing](https://docs.fireworks.ai/serverless/pricing) lists $0.05/M input and $0.20/M output tokens for this model. This is a low-cost candidate, not an evaluated quality winner or a free service. Inference remains disabled until account free credits or an explicit paid budget is established. The explanation adapter is separate from the default worker; deterministic evidence checks work without a provider.
