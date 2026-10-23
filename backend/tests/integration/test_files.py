import hashlib
from conftest import headers, create, artwork


def test_upload_retrieve_and_versions(client):
    review = create(client)
    a = artwork(client, review)
    assert a.status_code == 201, a.text
    body = a.json()
    stored = client.get(body["url"], headers=headers())
    assert hashlib.sha256(stored.content).hexdigest() == body["fileHash"]
    assert body["pages"] == [{"width": 80, "height": 100, "rotation": 0}]
    assert artwork(client, review).json()["version"] == 2
    detail = client.get("/v1/reviews/" + review["id"], headers=headers()).json()
    assert len(detail["artworkVersions"]) == 2
    listing = client.get("/v1/reviews", headers=headers()).json()["items"]
    assert (
        len(listing) == 1
        and listing[0]["checks"] == []
        and "latestRunId" not in listing[0]
    )


def test_reject_disguised_and_oversized_files(client):
    review = create(client)
    for content in (b"<svg/>", b"%PDF-invalid", b"x" * (20 * 1024 * 1024 + 1)):
        response = client.post(
            f"/v1/reviews/{review['id']}/artworks",
            headers=headers(),
            files={"file": ("fake.png", content, "image/png")},
        )
        assert response.status_code in (413, 422), response.text
        assert {
            "code",
            "message",
            "details",
            "requestId",
            "retryable",
        } <= response.json().keys()
