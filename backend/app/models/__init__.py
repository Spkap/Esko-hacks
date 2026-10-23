from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import (
    String,
    DateTime,
    Integer,
    JSON,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def now():
    return datetime.now(timezone.utc)


def identifier():
    return str(uuid4())


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=identifier)
    owner: Mapped[str] = mapped_column(String, index=True)
    product_name: Mapped[str] = mapped_column(String)
    market: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    current_artwork_id: Mapped[str | None] = mapped_column(String, nullable=True)
    latest_run_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (Index("ix_reviews_owner_updated", "owner", "updated_at"),)


class FileRevision(Base):
    __tablename__ = "file_revisions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=identifier)
    review_id: Mapped[str] = mapped_column(ForeignKey("reviews.id"), index=True)
    kind: Mapped[str] = mapped_column(String)
    revision: Mapped[int] = mapped_column(Integer)
    filename: Mapped[str] = mapped_column(String)
    path: Mapped[str] = mapped_column(String)
    sha256: Mapped[str] = mapped_column(String)
    file_type: Mapped[str] = mapped_column(String)
    pages: Mapped[list] = mapped_column(JSON, default=list)
    role: Mapped[str | None] = mapped_column(String, nullable=True)
    approval_status: Mapped[str | None] = mapped_column(String, nullable=True)
    reading_status: Mapped[str] = mapped_column(String, default="unread")
    extraction: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    __table_args__ = (UniqueConstraint("review_id", "kind", "revision"),)


class Run(Base):
    __tablename__ = "runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=identifier)
    review_id: Mapped[str] = mapped_column(ForeignKey("reviews.id"), index=True)
    owner: Mapped[str] = mapped_column(String)
    request_key: Mapped[str] = mapped_column(String)
    input_hash: Mapped[str] = mapped_column(String)
    artwork_id: Mapped[str] = mapped_column(ForeignKey("file_revisions.id"))
    reference_ids: Mapped[list] = mapped_column(JSON)
    rule_set_version: Mapped[str] = mapped_column(String)
    selected_rule_ids: Mapped[list] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String, default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    lease_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    lease_token: Mapped[str | None] = mapped_column(String, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    report: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    __table_args__ = (
        UniqueConstraint("owner", "review_id", "request_key"),
        Index("ix_runs_state_lease", "status", "lease_until"),
    )


class Check(Base):
    __tablename__ = "checks"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    payload: Mapped[dict] = mapped_column(JSON)


class Decision(Base):
    __tablename__ = "decisions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=identifier)
    check_id: Mapped[str] = mapped_column(ForeignKey("checks.id"), index=True)
    action: Mapped[str] = mapped_column(String)
    actor: Mapped[str] = mapped_column(String)
    reason: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
