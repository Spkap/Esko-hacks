"""Initial private reviews, immutable file revisions, leased runs and decisions."""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def column(name, kind=sa.String, **kwargs):
    return sa.Column(name, kind, nullable=False, **kwargs)


def nullable(name, kind=sa.String):
    return sa.Column(name, kind, nullable=True)


def fk(name, target):
    return sa.Column(name, sa.String, sa.ForeignKey(target), nullable=False)


def upgrade():
    op.create_table(
        "reviews",
        column("id", primary_key=True),
        column("owner"),
        column("product_name"),
        column("market"),
        column("category"),
        nullable("current_artwork_id"),
        nullable("latest_run_id"),
        column("created_at", sa.DateTime(timezone=True)),
        column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_reviews_owner", "reviews", ["owner"])
    op.create_index("ix_reviews_owner_updated", "reviews", ["owner", "updated_at"])
    op.create_table(
        "file_revisions",
        column("id", primary_key=True),
        fk("review_id", "reviews.id"),
        column("kind"),
        column("revision", sa.Integer),
        column("filename"),
        column("path"),
        column("sha256"),
        column("file_type"),
        column("pages", sa.JSON),
        nullable("role"),
        nullable("approval_status"),
        column("reading_status"),
        nullable("extraction", sa.JSON),
        sa.UniqueConstraint("review_id", "kind", "revision"),
    )
    op.create_index("ix_file_revisions_review_id", "file_revisions", ["review_id"])
    op.create_table(
        "runs",
        column("id", primary_key=True),
        fk("review_id", "reviews.id"),
        column("owner"),
        column("request_key"),
        column("input_hash"),
        fk("artwork_id", "file_revisions.id"),
        column("reference_ids", sa.JSON),
        column("rule_set_version"),
        column("selected_rule_ids", sa.JSON),
        column("status"),
        column("created_at", sa.DateTime(timezone=True)),
        nullable("started_at", sa.DateTime(timezone=True)),
        nullable("lease_until", sa.DateTime(timezone=True)),
        nullable("lease_token"),
        column("attempts", sa.Integer),
        nullable("error", sa.JSON),
        nullable("report", sa.JSON),
        sa.UniqueConstraint("owner", "review_id", "request_key"),
    )
    op.create_index("ix_runs_review_id", "runs", ["review_id"])
    op.create_index("ix_runs_state_lease", "runs", ["status", "lease_until"])
    op.create_table(
        "checks",
        column("id", primary_key=True),
        fk("run_id", "runs.id"),
        column("payload", sa.JSON),
    )
    op.create_index("ix_checks_run_id", "checks", ["run_id"])
    op.create_table(
        "decisions",
        column("id", primary_key=True),
        fk("check_id", "checks.id"),
        column("action"),
        column("actor"),
        column("reason"),
        column("timestamp", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_decisions_check_id", "decisions", ["check_id"])


def downgrade():
    for table in ("decisions", "checks", "runs", "file_revisions", "reviews"):
        op.drop_table(table)
