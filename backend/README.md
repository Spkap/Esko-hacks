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

The Next bridge rejects non-loopback Host headers and cross-origin mutations; it is not a deployable public login substitute. Database JWT secrets and the server token stay in ignored environment files. The processing path uses local extraction and deterministic rules. Set `WAVELENGTH_AI_ENABLED=true` with the server-only Fireworks URL, model, and key to add model-generated explanations to new runs. Explanations preserve the comparison result and require reviewer verification.

## Complete local acceptance exercise

With API and worker running, execute `uv run --env-file .env python ../scripts/verify-live.py` from `backend/`. It uploads actual PDFs, checks 330 mL versus 250 mL, reuploads corrected 250 mL, checks file hashes and immutable historical results, tests duplicate request keys, records/reopens a decision, and attempts cross-user document/report access. It creates its own acceptance review in the configured database. Use a disposable database for repeatable automated verification.

### Fireworks prototype configuration

`.env.example` includes an optional Fireworks endpoint and the available Nemotron 3.5 Lightning 30B A3B model. The key belongs only in ignored `.env` (mode 0600), never frontend environment variables. Authentication and model availability were verified using the read-only models endpoint.

As checked on 2026-10-27, [serverless pricing](https://docs.fireworks.ai/serverless/pricing) lists $0.05/M input and $0.20/M output tokens for this model. Provider calls use account credits and are not guaranteed to be free. The worker invokes the explanation adapter only when explicitly enabled; deterministic evidence checks work without a provider. A real local PDF/specification review has completed with a saved Fireworks explanation for its quantity mismatch.

## One-command local startup

After configuring the backend environment and PostgreSQL once, run from the repository root:

```sh
python3 scripts/run-local.py --check
python3 scripts/run-local.py --production
# Or use the development frontend:
python3 scripts/run-local.py
```

The launcher checks prerequisites and database connectivity, applies migrations, refreshes a server-only seven-day reviewer token, installs locked packages, and supervises API, worker, and frontend. Ctrl-C stops only the app processes it created. An unexpected service exit shuts down that stack and returns a failure. It refuses to replace services already using ports 8000/3000. PostgreSQL remains running. Restart the launcher to refresh an expired token.

For an existing local PostgreSQL cluster, set `WAVELENGTH_LOCAL_PGDATA` to its absolute directory so the launcher can start it when offline. It never initializes or replaces an arbitrary database. This workspace uses ignored `backend/.data/postgres`, `backend/.data/uploads` and `backend/.data/tessdata` for durable local data. Preserve these folders when keeping reviews; they are not Git backups.

## Structured reference format

Upload JSON with `schemaVersion: "1"`, a `product` object, and `requiredStatements`. The [example](../reference-data/live-specification-example.json) includes product quantity, composition, and an explicit company-policy condition. Each requirement has `id`, `text`, optional `title`, optional `anyOf` accepted literal forms, and optional `appliesWhen`.

`appliesWhen` supports exact `market`/`category` matching and `juiceBelowPercent` on the explicit `measurementBasis: "volume"`. A threshold of 5 means strictly below 5; exactly 5 is not applicable. Unknown composition/basis, multiple product specifications, draft/conflicting data, or uncertain reading require review. These are supplied policy conditions, not inferred legislation. Alternative disclosures are exact normalized text comparisons; image symbolism, assembled visibility, placement and physical type size remain manual review. A missing statement is a failure only for explicitly complete supplied panels whose native text coverage the extractor can verify.

Within an existing review, upload a corrected artwork or expand **Update the specification or rerun current inputs**. Updated product specifications replace earlier product specifications only for the new run. **Analysis history** opens previous runs, including when a newer artwork has no run yet. Reports bind to the original file hashes and reference revisions.

## Optional AI enrichment

When explicitly enabled, the worker runs a separate explanation process after deterministic checking. Only the fixed comparison and cited excerpt are sent; credentials are excluded from document parsers. At most three checks per run, 6,000 UTF-8 bytes per comparison, 384 output tokens per call, a ten-second request timeout, one transient retry, and a bounded stage budget constrain requests. Permanent authorization failures are not retried. Missing sources, unsupported citations, malformed responses and changed rule/result values are rejected. Provider failure is visible as unavailable enrichment and never fabricates a successful comparison. The UI labels generated explanations as requiring reviewer verification. Model/prompt identifiers and status are saved with the immutable report.

Protocol tests use controlled responses. A live Fireworks smoke check verified provider generation, worker persistence, and display of a cited explanation in the local review UI. This is not a model quality benchmark: explanations can still require correction, and model-based visual interpretation is not implemented. The application also works with local OCR and deterministic comparisons when enrichment is disabled.
