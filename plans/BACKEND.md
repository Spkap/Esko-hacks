# Wavelength Backend Implementation Plan

> **For implementation agents:** Use `superpowers:executing-plans` task by task. Track completion with the checkboxes below.

**Goal:** Replace simulated results with real file reading and checks while preserving the frontend.

**Architecture:** FastAPI saves files and creates jobs. A separate worker reads files, checks a fixed rule set, and saves a report. The frontend uses the same data interface defined in [the main plan](../../IMPLEMENTATION_GUIDE.md#shared-data-rules).

**Tech stack:** Python, FastAPI, Pydantic, PostgreSQL, SQLAlchemy, Alembic, pytest; a server-side AI provider selected by measured sample performance.

**Start after M6.** Keep the frontend in demo mode until M10 passes.

## Files

| Path | Responsibility |
|---|---|
| `contracts/openapi.json` | API fields, responses, errors. |
| `backend/app/api/` | Requests, authentication, ownership checks. |
| `backend/app/models/` | Reviews, file revisions, jobs, results, decisions. |
| `backend/app/storage.py` | Private file access. |
| `backend/app/worker.py` | Job claiming, stage execution, restart recovery. |
| `backend/app/extraction/` | PDF/image reading, OCR, product-sheet parsing. |
| `backend/app/verification/` | Rule selection, exact checks, AI explanations. |
| `backend/migrations/` | Database changes. |
| `backend/tests/` | Unit, integration, and AI output checks. |
| `frontend/src/data/http-repository.ts` | Backend implementation of the shared data interface. |

## M7: Store reviews, files, and jobs

- [ ] Define Pydantic request/response models matching the main plan; export `contracts/openapi.json`. Check round-trips against the frontend’s Zod schemas in `frontend/tests/contracts/repository.test.ts`.
- [ ] Create database tables and an Alembic migration. Save file bytes outside public web folders before creating an analysis job; store the file hash and revision.
- [ ] Implement the endpoints below, private file retrieval, and structured errors. Use real multipart uploads, not caller-supplied file paths.
- [ ] Implement one database-backed worker and the job behavior below.
- [ ] Add `backend/tests/integration/test_files.py`, `test_ownership.py`, and `test_jobs.py`.

| Method and path | Returns |
|---|---|
| `GET /v1/health` | Service status. |
| `GET /v1/reviews` | Searchable list, cursor/limit pagination. |
| `POST /v1/reviews` | New review. |
| `GET /v1/reviews/{id}` | Review and document versions. |
| `POST /v1/reviews/{id}/artworks` | Uploaded artwork version. |
| `POST /v1/reviews/{id}/references` | Uploaded reference revision and declared role/status. |
| `GET /v1/files/{id}` | Authorized file bytes. |
| `POST /v1/runs` | HTTP 202 and run ID. |
| `GET /v1/runs/{id}` | Current job state. |
| `POST /v1/runs/{id}/cancel` | Updated state. |
| `GET /v1/runs/{id}/report` | Results, scope, sources, decisions. |
| `POST /v1/checks/{id}/decisions` | Decision with server-derived actor. |

Return errors as `{code, message, details, requestId, retryable}`. Distinguish invalid input, unsupported scope, forbidden/not-found, conflict, oversized input, reading failure, provider failure, and timeout.

**Ownership:** Derive the user from a verified session/token. Check review ownership for every document, run, report, and decision. For isolated tests, inject two fixed test identities. Production startup must reject test authentication. Choose the real verifier during M7 before exposing live file processing publicly.

**Limits:** Artwork accepts PDF/PNG/JPEG, at most 20 MiB and 20 PDF pages. References accept supported JSON/XLSX and PDF rule documents. Check actual bytes/type, decompressed image size, and parser limits server-side. Keep database/provider credentials out of browser code. Render document text as escaped text, and treat its instructions as untrusted input.

**Checkpoint:** Tests prove upload/retrieval, ownership isolation, invalid-file rejection, duplicate-request handling, worker recovery, and cancellation. No simulated reports count as backend verification.

### Job behavior

```text
queued -> extracting -> checking -> completed
   |          |            |
   +----------+------------+----> failed / cancelled
```

A completed job may contain failed checks. A cancelled job remains incomplete even if partial checks passed.

- Scope the request key to user/review. Repeating that request returns the same run. Reject reuse with different inputs; use a new key for an intentional rerun.
- Save exact artwork/reference/rule versions on the run. Updated references produce new revisions; parsing produces derived specification data linked to its input revision. Historical reports stay unchanged.
- Claim a job atomically with an expiring worker lease. After a crash, reclaim expired work within a bounded attempt count.
- Check cancellation and lease ownership before each stage and final save. A cancelled or replaced worker cannot publish results. Save the final report in one database transaction.
- Start with a five-minute run limit, bounded model calls, and one retry for transient provider failures. Persist the failure reason when the budget is exhausted.

## M8: Read actual files

- [ ] Implement PDF/image reading in `backend/app/extraction/documents.py`. Preserve page size, crop, rotation, text, and coordinates. Prefer usable native text; use OCR/vision when required.
- [ ] Implement JSON/XLSX product-reference reading in `backend/app/extraction/references.py`. Preserve units, sheet/cell locations, approval status, and conflicting values.
- [ ] Choose the PDF/OCR library after checking license, deployment compatibility, and results on the sample files. Save the choice and measured failures with the test results.
- [ ] Add `backend/tests/integration/test_extraction.py` covering text PDFs, scans, Japanese text, rotated pages, incomplete artwork, malformed/password-protected files, and conflicting spreadsheets.

Compare extracted values and regions with human-labeled examples. Unreadable text stays unknown. Partial artwork cannot prove a statement is absent from the whole package. Screenshot pixels cannot establish printed font size without physical scale.

**Checkpoint:** Every extracted field can be traced to its file revision and page/region or sheet/cell. Reading failures show a useful error instead of an empty successful report.

## M9: Run checks and explain them

- [ ] Implement applicability and exact comparisons in `backend/app/verification/rules.py`: supported category/market, composition, units, required content, approved-value agreement.
- [ ] Add `backend/tests/unit/test_rules.py`: compatible/incompatible units, 0%, below 5%, exactly 5%, unknown measurement basis, uncertain applicability, draft/conflicting specifications, incomplete panels.
- [ ] Implement visual observations and explanations through one configurable provider in `backend/app/verification/ai.py`. Use code for exact comparisons; use AI for interpretation and explanation.
- [ ] Add `backend/tests/evals/test_explanations.py`: missing/false citations, unsupported rules, unreadable text, hostile document instructions, provider errors, and contradictory claims.

Every result must contain applicability, result, observed/expected values, supporting source/location, artwork evidence, correction, and an uncertainty reason when needed. Missing text uses inspected panels without an invented region.

Validate AI output before saving it. It may cite only supplied source IDs and cannot change an established check result or modify artwork. A missing source or uncertain interpretation becomes `needs_review`, not a confirmed legal failure.

**Checkpoint:** Run the frozen M5 examples through real extraction and checking. Record expected versus actual results, missed issues, unsupported findings, latency, provider/model ID, prompt version, rule version, and cost when available. Review disagreements before enabling live mode.

## M10: Connect the backend

- [ ] Implement all shared operations in `frontend/src/data/http-repository.ts`. Validate responses and map errors to visible retry/recovery states.
- [ ] Upload actual file bytes, start the job, and poll status from one second up to five-second intervals. Stop on completion/cancellation/failure or navigation away; ignore responses for an old selected run. Offer recovery when the five-minute budget expires.
- [ ] Run the same data-interface tests against demo and HTTP implementations. Use HTTP test mocks for timeout, malformed response, unauthorized access, and server failures.
- [ ] Add `frontend/tests/e2e/live.spec.ts` using the real API, worker, database, and files. Assert that the report refers to the actual upload hash and current document/rule versions.
- [ ] Remove sample answers from the live path. Retain samples in explicit demo mode and regression tests. Verify switching back to demo.

**Checkpoint:** A new supported upload produces actual results; a provider/backend failure remains a failure. Tests cover duplicate starts, stale responses, cancellation after partial passes, worker restart, and cross-user file/report access. The M6 frontend demo still passes.

## Commands and release checks

Create `backend/pyproject.toml`, its lockfile, and setup instructions in M7. After environment changes:

```sh
cd backend
uv sync --frozen
```

Apply migrations to a disposable test database before integration tests:

```sh
uv run alembic upgrade head
uv run pytest tests/unit tests/integration
```

M9 adds `uv run pytest tests/evals`. M10 adds `pnpm -C frontend test:contracts` and `pnpm -C frontend test:e2e --grep live`. Expected: exit code 0; record actual results in `PROGRESS.md`.

Before public live deployment, verify real authentication, private file access, parser isolation/resource limits, server-only credentials, and no sensitive document text in general logs. Record run IDs, stage times, failures, attempts, and model cost where available.

Load PDF pages on demand and release render tasks/object URLs. Limit list pages to 25 reviews; index owner/date and job state/lease fields. Keep rule/source versions fixed per run. Add infrastructure only when measured load requires it.
