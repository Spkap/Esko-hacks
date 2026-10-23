from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ReviewInput(Model):
    productName: str = Field(min_length=1, max_length=300)
    market: str = Field(min_length=1, max_length=50)
    category: str = Field(min_length=1, max_length=100)


class RunInput(Model):
    reviewId: str
    artworkVersionId: str
    referenceIds: list[str] = Field(max_length=30)
    ruleSetVersion: str
    selectedRuleIds: list[str] = Field(min_length=1, max_length=20)
    requestKey: str = Field(min_length=1, max_length=200)


class DecisionInput(Model):
    action: Literal["open", "acknowledged", "dismissed"]
    reason: str = Field(default="", max_length=3000)

    @model_validator(mode="after")
    def dismissal_reason(self):
        if self.action == "dismissed" and not self.reason.strip():
            raise ValueError("A dismissal requires a reason")
        return self


def review_json(r):
    out = dict(
        id=r.id,
        productName=r.product_name,
        market=r.market,
        category=r.category,
        currentArtworkVersionId=r.current_artwork_id or "",
        createdAt=r.created_at.isoformat(),
        updatedAt=r.updated_at.isoformat(),
    )
    if r.latest_run_id:
        out["latestRunId"] = r.latest_run_id
    return out


def file_json(f):
    common = dict(
        id=f.id, reviewId=f.review_id, fileHash=f.sha256, url=f"/v1/files/{f.id}"
    )
    if f.kind == "artwork":
        return dict(
            **common,
            version=f.revision,
            filename=f.filename,
            fileType=f.file_type,
            pages=f.pages,
        )
    return dict(
        **common,
        revision=f.revision,
        title=f.filename,
        role=f.role,
        approvalStatus=f.approval_status,
        readingStatus=f.reading_status,
    )


def run_json(r):
    out = dict(
        id=r.id,
        reviewId=r.review_id,
        artworkVersionId=r.artwork_id,
        referenceIds=r.reference_ids,
        ruleSetVersion=r.rule_set_version,
        selectedRuleIds=r.selected_rule_ids,
        mode="live",
        status=r.status,
        requestKey=r.request_key,
        createdAt=r.created_at.isoformat(),
    )
    if r.error:
        out["error"] = r.error
    return out


def decision_json(d):
    return dict(
        checkId=d.check_id,
        action=d.action,
        actor=d.actor,
        reason=d.reason,
        timestamp=d.timestamp.isoformat(),
    )


class Page(Model):
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    rotation: Literal[0, 90, 180, 270]
    url: str | None = None


class ReviewOutput(Model):
    id: str
    productName: str
    category: str
    market: str
    currentArtworkVersionId: str
    latestRunId: str | None = None
    createdAt: str
    updatedAt: str


class ArtworkOutput(Model):
    id: str
    reviewId: str
    version: int = Field(gt=0)
    filename: str
    fileHash: str
    fileType: Literal["image/png", "image/jpeg", "application/pdf"]
    url: str
    pages: list[Page] = Field(min_length=1)


class ReferenceOutput(Model):
    id: str
    reviewId: str
    revision: int = Field(gt=0)
    title: str
    fileHash: str
    role: Literal["regulatory_reference", "company_policy", "product_specification"]
    approvalStatus: Literal["draft", "approved", "unknown"]
    readingStatus: Literal["read", "unread", "partial", "failed"]
    url: str


class RunOutput(Model):
    id: str
    reviewId: str
    artworkVersionId: str
    referenceIds: list[str]
    ruleSetVersion: str
    selectedRuleIds: list[str]
    mode: Literal["live"]
    status: Literal[
        "queued", "extracting", "checking", "completed", "failed", "cancelled"
    ]
    requestKey: str
    createdAt: str
    error: dict | None = None


class Region(Model):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(gt=0, le=1)
    height: float = Field(gt=0, le=1)

    @model_validator(mode="after")
    def fits(self):
        if self.x + self.width > 1 or self.y + self.height > 1:
            raise ValueError("Region must fit within page")
        return self


class Evidence(Model):
    artworkVersionId: str
    page: int = Field(gt=0)
    region: Region | None = None
    inspectedPanels: str
    sourceId: str
    sourceLocation: str
    excerpt: str


class AIExplanation(Model):
    status: Literal[
        "disabled",
        "unavailable",
        "no_source",
        "input_limit",
        "budget_exhausted",
        "explained",
        "provider_failed",
        "rejected",
    ]
    promptVersion: str
    model: str | None = None
    explanation: str | None = None
    sourceIds: list[str] | None = None


class CheckOutput(Model):
    id: str
    runId: str
    ruleId: str
    ruleVersion: str
    title: str
    kind: Literal["regulatory", "product_data", "brand"]
    applicability: Literal["applicable", "not_applicable", "uncertain"]
    result: Literal["pass", "fail", "needs_review", "not_checked"]
    observed: str
    expected: str
    suggestedCorrection: str
    reason: str | None = None
    evidence: Evidence
    aiExplanation: AIExplanation | None = None


class DecisionOutput(DecisionInput):
    checkId: str
    actor: str
    timestamp: str


class ReportOutput(Model):
    run: RunOutput
    checks: list[CheckOutput]
    reviewedScope: str
    uncheckedRequirements: list[str]
    decisions: list[DecisionOutput]


class DetailOutput(Model):
    review: ReviewOutput
    artworkVersions: list[ArtworkOutput]
    references: list[ReferenceOutput]
    runs: list[RunOutput] = Field(default_factory=list)


class ListItem(ReviewOutput):
    run: RunOutput
    checks: list[CheckOutput]
    artwork: ArtworkOutput


class ListOutput(Model):
    items: list[ListItem]
    nextCursor: str | None = None
