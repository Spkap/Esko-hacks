import base64
import hashlib
import json
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Depends, UploadFile, File, Form, Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from starlette.exceptions import HTTPException
from sqlalchemy import select, func, text
from sqlalchemy.exc import SQLAlchemyError
from app import auth
from app.database import Session
from app.errors import APIError
from app.models import Review, FileRevision, Run, Check, Decision, now
from app.schemas import (
    ReviewInput,
    RunInput,
    DecisionInput,
    review_json,
    file_json,
    run_json,
    decision_json,
)
from app.schemas import (
    ReviewOutput,
    ArtworkOutput,
    ReferenceOutput,
    RunOutput,
    DecisionOutput,
    ReportOutput,
    DetailOutput,
    ListOutput,
)
from app.storage import save_upload, storage_root


@asynccontextmanager
async def lifespan(app):
    auth.settings()
    storage_root()
    yield


from app.limits import BodyLimitMiddleware

app = FastAPI(title="Wavelength private API", version="1.0.0", lifespan=lifespan)

app.add_middleware(BodyLimitMiddleware)


@app.middleware("http")
async def request_id(request, call_next):
    request.state.request_id = str(uuid4())
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response


def error_response(request, status, code, message, details=None, retryable=False):
    return JSONResponse(
        status_code=status,
        content=dict(
            code=code,
            message=message,
            details=details or {},
            requestId=getattr(request.state, "request_id", str(uuid4())),
            retryable=retryable,
        ),
    )


@app.exception_handler(APIError)
async def api_error(request, exc):
    return error_response(
        request, exc.status, exc.code, exc.message, exc.details, exc.retryable
    )


@app.exception_handler(RequestValidationError)
async def invalid_request(request, exc):
    return error_response(
        request,
        422,
        "invalid_input",
        "Request validation failed",
        {
            "errors": [
                {"location": list(e["loc"]), "message": e["msg"]} for e in exc.errors()
            ]
        },
    )


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return error_response(
        request,
        exc.status_code,
        "not_found" if exc.status_code == 404 else "invalid_input",
        str(exc.detail),
    )


@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    return error_response(
        request, 500, "internal_error", "An internal error occurred", retryable=True
    )


def db():
    with Session() as session:
        yield session


def owned(session, review_id, owner, lock=False):
    query = select(Review).where(Review.id == review_id, Review.owner == owner)
    if lock:
        query = query.with_for_update()
    row = session.scalar(query)
    if not row:
        raise APIError(404, "not_found", "Review not found")
    return row


def owned_run(session, run_id, owner, lock=False):
    query = select(Run).where(Run.id == run_id, Run.owner == owner)
    if lock:
        query = query.with_for_update()
    row = session.scalar(query)
    if not row:
        raise APIError(404, "not_found", "Run not found")
    return row


@app.get("/v1/health")
def health(session=Depends(db)):
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise APIError(
            503, "database_unavailable", "The database is unavailable", retryable=True
        )
    return {
        "status": "ok",
        "mode": "live",
        "authentication": "jwt",
        "deployment": "private-local",
    }


@app.post(
    "/v1/reviews",
    status_code=201,
    response_model=ReviewOutput,
    response_model_exclude_none=True,
)
def create_review(data: ReviewInput, owner=Depends(auth.identity), session=Depends(db)):
    row = Review(
        owner=owner,
        product_name=data.productName.strip(),
        market=data.market.strip(),
        category=data.category.strip(),
    )
    if not all((row.product_name, row.market, row.category)):
        raise APIError(422, "invalid_input", "Review fields cannot be blank")
    session.add(row)
    session.commit()
    return review_json(row)


@app.get("/v1/reviews", response_model=ListOutput, response_model_exclude_none=True)
def list_reviews(
    search: str = "",
    market: str = "",
    result: str = "",
    cursor: str | None = None,
    limit: int = Query(25, ge=1, le=25),
    owner=Depends(auth.identity),
    session=Depends(db),
):
    query = (
        select(Review)
        .where(Review.owner == owner, Review.current_artwork_id.is_not(None))
        .order_by(Review.updated_at.desc(), Review.id.desc())
    )
    if search:
        query = query.where(
            Review.product_name.ilike(
                "%" + search.replace("%", "\\%").replace("_", "\\_") + "%", escape="\\"
            )
        )
    if market:
        query = query.where(Review.market == market)
    offset = 0
    if cursor:
        try:
            decoded = json.loads(base64.urlsafe_b64decode(cursor.encode()))
            if decoded["owner"] != owner:
                raise ValueError()
            offset = int(decoded["offset"])
            if offset < 0 or offset > 1000000:
                raise ValueError()
        except Exception:
            raise APIError(422, "invalid_input", "Invalid pagination cursor")
    rows = session.scalars(query.execution_options(yield_per=25))
    items = []
    for row in rows:
        artwork = session.get(FileRevision, row.current_artwork_id)
        run = session.get(Run, row.latest_run_id) if row.latest_run_id else None
        checks = (
            [
                c.payload
                for c in session.scalars(
                    select(Check).where(Check.run_id == run.id)
                ).all()
            ]
            if run
            else []
        )
        if run:
            relevant_checks = [
                c for c in checks if c["applicability"] != "not_applicable"
            ]
            run_value = run_json(run)
            summary = (
                run.status
                if run.status != "completed"
                else (
                    "issues"
                    if any(c["result"] == "fail" for c in relevant_checks)
                    else "incomplete"
                    if any(
                        c["applicability"] == "uncertain"
                        or c["result"] in ("needs_review", "not_checked")
                        for c in relevant_checks
                    )
                    else "passed"
                    if any(c["applicability"] == "applicable" for c in relevant_checks)
                    else "no_applicable"
                )
            )
        else:
            run_value = dict(
                id="unrun:" + row.id,
                reviewId=row.id,
                artworkVersionId=artwork.id,
                referenceIds=[],
                ruleSetVersion="",
                selectedRuleIds=[],
                mode="live",
                status="queued",
                requestKey="",
                createdAt=row.created_at.isoformat(),
            )
            summary = "unrun"
        aliases = {
            "issues_found": "issues",
            "review_incomplete": "incomplete",
            "selected_checks_passed": "passed",
        }
        if (
            result
            and aliases.get(result.lower().replace(" ", "_"), result.lower()) != summary
        ):
            continue
        items.append(
            dict(
                **review_json(row),
                artwork=file_json(artwork),
                run=run_value,
                checks=checks,
            )
        )
        if len(items) > offset + limit:
            break
    page = items[offset : offset + limit]
    out = {"items": page}
    if len(items) > offset + limit:
        out["nextCursor"] = base64.urlsafe_b64encode(
            json.dumps({"owner": owner, "offset": offset + limit}).encode()
        ).decode()
    return out


@app.get(
    "/v1/reviews/{review_id}",
    response_model=DetailOutput,
    response_model_exclude_none=True,
)
def get_review(review_id: str, owner=Depends(auth.identity), session=Depends(db)):
    row = owned(session, review_id, owner)
    files = session.scalars(
        select(FileRevision)
        .where(FileRevision.review_id == row.id)
        .order_by(FileRevision.revision)
    ).all()
    return dict(
        review=review_json(row),
        artworkVersions=[file_json(f) for f in files if f.kind == "artwork"],
        references=[file_json(f) for f in files if f.kind == "reference"],
        runs=[
            run_json(r)
            for r in session.scalars(
                select(Run)
                .where(Run.review_id == row.id)
                .order_by(Run.created_at.desc())
                .limit(100)
            ).all()
        ],
    )


async def upload_revision(
    review_id, upload, kind, owner, session, role=None, approval=None
):
    row = owned(session, review_id, owner, lock=True)
    path, sha256, file_type, pages = await save_upload(upload, kind)
    try:
        revision = (
            session.scalar(
                select(func.max(FileRevision.revision)).where(
                    FileRevision.review_id == row.id, FileRevision.kind == kind
                )
            )
            or 0
        ) + 1
        record = FileRevision(
            review_id=row.id,
            kind=kind,
            revision=revision,
            filename=Path(upload.filename or "upload").name[:240],
            path=str(path),
            sha256=sha256,
            file_type=file_type,
            pages=pages,
            role=role,
            approval_status=approval,
        )
        session.add(record)
        session.flush()
        if kind == "artwork":
            row.current_artwork_id = record.id
            row.latest_run_id = None
        row.updated_at = now()
        session.commit()
        return file_json(record)
    except Exception:
        session.rollback()
        path.unlink(missing_ok=True)
        raise


@app.post(
    "/v1/reviews/{review_id}/artworks",
    status_code=201,
    response_model=ArtworkOutput,
    response_model_exclude_none=True,
)
async def add_artwork(
    review_id: str,
    file: UploadFile = File(),
    owner=Depends(auth.identity),
    session=Depends(db),
):
    return await upload_revision(review_id, file, "artwork", owner, session)


@app.post(
    "/v1/reviews/{review_id}/references",
    status_code=201,
    response_model=ReferenceOutput,
    response_model_exclude_none=True,
)
async def add_reference(
    review_id: str,
    file: UploadFile = File(),
    role: str = Form(),
    approvalStatus: str = Form(),
    owner=Depends(auth.identity),
    session=Depends(db),
):
    if role not in (
        "regulatory_reference",
        "company_policy",
        "product_specification",
    ) or approvalStatus not in ("draft", "approved", "unknown"):
        raise APIError(
            422, "invalid_input", "Unsupported reference role or approval status"
        )
    return await upload_revision(
        review_id, file, "reference", owner, session, role, approvalStatus
    )


@app.get("/v1/files/{file_id}")
def get_file(file_id: str, owner=Depends(auth.identity), session=Depends(db)):
    record = session.get(FileRevision, file_id)
    if not record:
        raise APIError(404, "not_found", "File not found")
    owned(session, record.review_id, owner)
    path = Path(record.path).resolve()
    if path.parent != storage_root() or not path.is_file():
        raise APIError(404, "not_found", "Stored file unavailable")
    return FileResponse(
        path,
        media_type=record.file_type,
        filename=record.filename,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.post(
    "/v1/runs",
    status_code=202,
    response_model=RunOutput,
    response_model_exclude_none=True,
)
def start_run(data: RunInput, owner=Depends(auth.identity), session=Depends(db)):
    review = owned(session, data.reviewId, owner, lock=True)
    fingerprint = hashlib.sha256(
        json.dumps(data.model_dump(exclude={"requestKey"}), sort_keys=True).encode()
    ).hexdigest()
    existing = session.scalar(
        select(Run).where(
            Run.review_id == review.id,
            Run.owner == owner,
            Run.request_key == data.requestKey,
        )
    )
    if existing:
        if existing.input_hash != fingerprint:
            raise APIError(
                409, "conflict", "Request key already used with different inputs"
            )
        return run_json(existing)
    if review.market not in ("Japan", "JP", "US", "United States"):
        raise APIError(
            422,
            "unsupported_scope",
            "Only Japan and US document comparison scopes are supported",
        )
    if data.ruleSetVersion != "wavelength-core-v1" or not set(data.selectedRuleIds) <= {
        "net-quantity",
        "required-statements",
        "physical-type-size",
    }:
        raise APIError(
            422, "unsupported_scope", "Unsupported rule set or selected rules"
        )
    artwork = session.get(FileRevision, data.artworkVersionId)
    if not artwork or artwork.review_id != review.id or artwork.kind != "artwork":
        raise APIError(404, "not_found", "Artwork version not found")
    if len(set(data.referenceIds)) != len(data.referenceIds) or len(
        set(data.selectedRuleIds)
    ) != len(data.selectedRuleIds):
        raise APIError(422, "invalid_input", "Duplicate reference or rule IDs")
    for reference_id in data.referenceIds:
        ref = session.get(FileRevision, reference_id)
        if not ref or ref.review_id != review.id or ref.kind != "reference":
            raise APIError(404, "not_found", "Reference revision not found")
    row = Run(
        review_id=review.id,
        owner=owner,
        request_key=data.requestKey,
        input_hash=fingerprint,
        artwork_id=artwork.id,
        reference_ids=data.referenceIds,
        rule_set_version=data.ruleSetVersion,
        selected_rule_ids=data.selectedRuleIds,
    )
    session.add(row)
    session.flush()
    review.latest_run_id = row.id
    review.updated_at = now()
    session.commit()
    return run_json(row)


@app.get(
    "/v1/runs/{run_id}", response_model=RunOutput, response_model_exclude_none=True
)
def get_run(run_id: str, owner=Depends(auth.identity), session=Depends(db)):
    return run_json(owned_run(session, run_id, owner))


@app.post(
    "/v1/runs/{run_id}/cancel",
    response_model=RunOutput,
    response_model_exclude_none=True,
)
def cancel_run(run_id: str, owner=Depends(auth.identity), session=Depends(db)):
    row = owned_run(session, run_id, owner, lock=True)
    if row.status not in ("completed", "failed", "cancelled"):
        row.status = "cancelled"
        row.lease_token = None
        row.lease_until = None
        session.commit()
    return run_json(row)


@app.get(
    "/v1/runs/{run_id}/report",
    response_model=ReportOutput,
    response_model_exclude_none=True,
)
def get_report(run_id: str, owner=Depends(auth.identity), session=Depends(db)):
    row = owned_run(session, run_id, owner)
    if row.status != "completed" or not row.report:
        raise APIError(
            409,
            "report_unavailable",
            "A report is available only after a completed run",
            {"status": row.status},
            retryable=row.status in ("queued", "extracting", "checking"),
        )
    checks = session.scalars(select(Check).where(Check.run_id == row.id)).all()
    ids = [c.id for c in checks]
    decisions = (
        session.scalars(
            select(Decision)
            .where(Decision.check_id.in_(ids))
            .order_by(Decision.timestamp)
        ).all()
        if ids
        else []
    )
    return dict(
        run=run_json(row),
        **row.report,
        decisions=list({d.check_id: decision_json(d) for d in decisions}.values()),
    )


@app.post(
    "/v1/checks/{check_id}/decisions",
    status_code=201,
    response_model=DecisionOutput,
    response_model_exclude_none=True,
)
def record_decision(
    check_id: str,
    data: DecisionInput,
    owner=Depends(auth.identity),
    session=Depends(db),
):
    check = session.get(Check, check_id)
    if not check:
        raise APIError(404, "not_found", "Check not found")
    owned_run(session, check.run_id, owner)
    row = Decision(
        check_id=check.id, action=data.action, actor=owner, reason=data.reason.strip()
    )
    session.add(row)
    session.commit()
    return decision_json(row)
