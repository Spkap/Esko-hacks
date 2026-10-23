"""Real local API/worker acceptance exercise. Run with backend's uv environment.

Requires an API and separate worker against an isolated disposable PostgreSQL DB.
No mock transport, sample repository, external model call, or fixture answer is used.
"""

import hashlib
import io
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import httpx
import jwt
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject


def label_pdf(quantity, statement=True):
    writer = PdfWriter()
    page = writer.add_blank_page(600, 400)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {NameObject("/F1"): writer._add_object(font)}
            )
        }
    )
    lines = [
        "WAVELENGTH ACCEPTANCE ARTWORK",
        "Fruit beverage - supplied front and back panels",
        f"NET CONTENT {quantity} mL",
    ]
    if statement:
        lines.append("JUICE 2%")
    content = DecodedStreamObject()
    content.set_data(
        (
            "BT /F1 18 Tf 40 340 Td "
            + " 0 -35 Td ".join("(" + line + ") Tj" for line in lines)
            + " ET"
        ).encode()
    )
    page[NameObject("/Contents")] = writer._add_object(content)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def token(subject):
    return jwt.encode(
        {
            "sub": subject,
            "iss": os.environ.get("WAVELENGTH_JWT_ISSUER", "wavelength-local"),
            "aud": os.environ.get("WAVELENGTH_JWT_AUDIENCE", "wavelength-api"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        os.environ["WAVELENGTH_JWT_SECRET"],
        algorithm="HS256",
    )


def main():
    base = os.environ.get("WAVELENGTH_API_URL", "http://127.0.0.1:8000")
    actor = "acceptance-" + uuid4().hex
    client = httpx.Client(
        base_url=base, headers={"Authorization": "Bearer " + token(actor)}, timeout=30
    )

    def request(method, path, **kwargs):
        response = client.request(method, path, **kwargs)
        assert response.is_success, (method, path, response.status_code, response.text)
        return response.json()

    review = request(
        "POST",
        "/v1/reviews",
        json={
            "productName": "Changed-byte acceptance review",
            "market": "Japan",
            "category": "Fruit beverage",
        },
    )
    review_id = review["id"]
    spec = {
        "schemaVersion": "1",
        "product": {
            "netQuantity": {"value": 250, "unit": "mL"},
            "completePanels": True,
        },
        "requiredStatements": [
            {"id": "juice", "title": "Juice statement", "text": "JUICE 2%"}
        ],
    }
    ref = request(
        "POST",
        f"/v1/reviews/{review_id}/references",
        files={
            "file": (
                "specification.json",
                json.dumps(spec).encode(),
                "application/json",
            )
        },
        data={"role": "product_specification", "approvalStatus": "approved"},
    )
    reports = []
    artworks = []
    for quantity, expected in [(330, "fail"), (250, "pass")]:
        raw = label_pdf(quantity)
        art = request(
            "POST",
            f"/v1/reviews/{review_id}/artworks",
            files={"file": ("label.pdf", raw, "application/pdf")},
        )
        assert art["fileHash"] == hashlib.sha256(raw).hexdigest()
        fetched = client.get(art["url"])
        assert fetched.content == raw
        payload = {
            "reviewId": review_id,
            "artworkVersionId": art["id"],
            "referenceIds": [ref["id"]],
            "ruleSetVersion": "wavelength-core-v1",
            "selectedRuleIds": ["net-quantity", "required-statements"],
            "requestKey": uuid4().hex,
        }
        run = request("POST", "/v1/runs", json=payload)
        duplicate = request("POST", "/v1/runs", json=payload)
        assert duplicate["id"] == run["id"]
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            state = request("GET", "/v1/runs/" + run["id"])
            assert state["status"] not in ("failed", "cancelled"), state
            if state["status"] == "completed":
                break
            time.sleep(0.2)
        else:
            raise AssertionError("Worker did not complete within 60 seconds")
        report = request("GET", "/v1/runs/" + run["id"] + "/report")
        comparison = next(c for c in report["checks"] if c["ruleId"] == "net-quantity")
        assert comparison["result"] == expected, comparison
        assert str(quantity) in comparison["observed"]
        assert comparison["evidence"]["artworkVersionId"] == art["id"]
        assert comparison["evidence"]["sourceId"] == ref["id"]
        assert report["run"]["mode"] == "live"
        reports.append(report)
        artworks.append(art)
    # A later upload/run must not mutate historical reports or file versions.
    old = request("GET", "/v1/runs/" + reports[0]["run"]["id"] + "/report")
    assert (
        old["checks"] == reports[0]["checks"]
        and artworks[0]["version"] == 1
        and artworks[1]["version"] == 2
    )
    check_id = reports[1]["checks"][0]["id"]
    request(
        "POST",
        f"/v1/checks/{check_id}/decisions",
        json={"action": "acknowledged", "reason": ""},
    )
    request(
        "POST",
        f"/v1/checks/{check_id}/decisions",
        json={"action": "open", "reason": ""},
    )
    latest = request("GET", "/v1/runs/" + reports[1]["run"]["id"] + "/report")
    assert (
        next(d for d in latest["decisions"] if d["checkId"] == check_id)["action"]
        == "open"
    )
    assert latest["checks"] == reports[1]["checks"]
    for path in [
        f"/v1/reviews/{review_id}",
        artworks[0]["url"],
        f"/v1/runs/{reports[0]['run']['id']}/report",
    ]:
        response = client.get(
            path, headers={"Authorization": "Bearer " + token(actor + "-other")}
        )
        assert response.status_code == 404, (path, response.status_code)
    detail = request("GET", f"/v1/reviews/{review_id}")
    assert len(detail["artworkVersions"]) == 2
    fixtures = {
        "review": detail["review"],
        "artwork": artworks[1],
        "reference": ref,
        "run": latest["run"],
        "report": latest,
        "detail": detail,
        "list": request("GET", "/v1/reviews"),
        "decision": latest["decisions"][0],
    }
    Path("/tmp/wavelength-live-contracts.json").write_text(
        json.dumps(fixtures, indent=2) + "\n"
    )
    result = {
        "reviewId": review_id,
        "runs": [r["run"]["id"] for r in reports],
        "hashes": [a["fileHash"] for a in artworks],
        "quantityResults": ["fail", "pass"],
        "versions": [1, 2],
        "duplicateStart": "passed",
        "historicalReport": "unchanged",
        "decisionRoundTrip": "passed",
        "crossUserIsolation": "passed",
        "mode": "live",
    }
    print(json.dumps(result, indent=2))
    Path("/tmp/wavelength-live-acceptance.json").write_text(
        json.dumps(result, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
