from datetime import timedelta
from conftest import headers, create, artwork, start
from app.database import Session
from app.models import Run, now
from app.worker import claim, active, process_job
import pytest


def test_idempotency_cancellation_and_expired_lease(client):
    review = create(client)
    art = artwork(client, review).json()
    first = start(client, review, art)
    assert first.status_code == 202, first.text
    assert start(client, review, art).json()["id"] == first.json()["id"]
    art2 = artwork(client, review).json()
    assert start(client, review, art2).status_code == 409
    run_id, token = claim()
    with Session.begin() as session:
        session.get(Run, run_id).lease_until = now() - timedelta(seconds=1)
    run2, token2 = claim()
    assert run_id == run2 and token != token2
    with Session.begin() as session:
        with pytest.raises(InterruptedError):
            active(session, run_id, token)
    assert (
        client.post(f"/v1/runs/{run_id}/cancel", headers=headers()).json()["status"]
        == "cancelled"
    )
    process_job(run_id, token2)
    with Session() as session:
        assert session.get(Run, run_id).report is None
    assert client.get(f"/v1/runs/{run_id}/report", headers=headers()).status_code == 409


def test_attempt_budget(client):
    review = create(client)
    art = artwork(client, review).json()
    run = start(client, review, art).json()
    for attempt in range(3):
        assert claim()
        with Session.begin() as session:
            session.get(Run, run["id"]).lease_until = now() - timedelta(seconds=1)
    assert claim() is None
    assert (
        client.get("/v1/runs/" + run["id"], headers=headers()).json()["status"]
        == "failed"
    )


def test_atomic_report_immutable_and_decisions_isolated(client, monkeypatch):
    import app.worker as worker

    review = create(client)
    art = artwork(client, review).json()
    start(client, review, art).json()

    def stage(run_id, token, operation, payload):
        if operation == "extract":
            return {
                "artwork": {
                    "id": art["id"],
                    "text": "250 mL",
                    "pages": art["pages"],
                    "readingStatus": "read",
                },
                "references": [],
            }
        return {
            "checks": [
                dict(
                    id="ignored",
                    runId=run_id,
                    ruleId="net-quantity",
                    ruleVersion="v1",
                    title="Quantity",
                    kind="product_data",
                    applicability="uncertain",
                    result="needs_review",
                    observed="250 mL",
                    expected="Unknown",
                    suggestedCorrection="Supply specification",
                    reason="No approved reference",
                    evidence=dict(
                        artworkVersionId=art["id"],
                        page=1,
                        inspectedPanels="Page 1",
                        sourceId="",
                        sourceLocation="No source",
                        excerpt="250 mL",
                    ),
                )
            ],
            "reviewedScope": "Actual text comparison",
            "uncheckedRequirements": ["Legal approval"],
        }

    monkeypatch.setattr(worker, "stage", stage)
    run_id, token = claim()
    process_job(run_id, token)
    report = client.get(f"/v1/runs/{run_id}/report", headers=headers())
    assert report.status_code == 200, report.text
    check_id = report.json()["checks"][0]["id"]
    assert (
        client.post(
            f"/v1/checks/{check_id}/decisions",
            headers=headers("bob"),
            json={"action": "acknowledged"},
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/v1/checks/{check_id}/decisions",
            headers=headers(),
            json={"action": "dismissed"},
        ).status_code
        == 422
    )
    for action in ["acknowledged", "open"]:
        response = client.post(
            f"/v1/checks/{check_id}/decisions",
            headers=headers(),
            json={"action": action},
        )
        assert response.status_code == 201 and response.json()["actor"] == "alice"
    report2 = client.get(f"/v1/runs/{run_id}/report", headers=headers()).json()
    assert (
        len(report2["decisions"]) == 1 and report2["decisions"][0]["action"] == "open"
    )
    process_job(run_id, token)
    assert (
        client.get(f"/v1/runs/{run_id}/report", headers=headers()).json()["checks"]
        == report.json()["checks"]
    )
    assert (
        client.post(f"/v1/runs/{run_id}/cancel", headers=headers()).json()["status"]
        == "completed"
    )
