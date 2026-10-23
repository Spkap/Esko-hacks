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


def test_history_remains_available_after_unrun_new_version(client):
    from conftest import start

    review = create(client)
    first_artwork = artwork(client, review).json()
    run = start(client, review, first_artwork).json()
    artwork(client, review)
    detail = client.get("/v1/reviews/" + review["id"], headers=headers()).json()
    assert "latestRunId" not in detail["review"]
    assert detail["runs"][0]["id"] == run["id"]
    assert detail["runs"][0]["artworkVersionId"] == first_artwork["id"]


def test_dashboard_artwork_matches_latest_analysis_snapshot(client):
    from conftest import start

    review = create(client)
    first = artwork(client, review).json()
    latest_upload = artwork(client, review).json()
    run = start(client, review, first).json()
    row = client.get("/v1/reviews", headers=headers()).json()["items"][0]
    assert row["currentArtworkVersionId"] == latest_upload["id"]
    assert row["run"]["id"] == run["id"]
    assert row["artwork"]["id"] == row["run"]["artworkVersionId"] == first["id"]


def test_pagination_search_and_cursor_owner_are_consistent(client):
    from conftest import headers

    first = create(client)
    artwork(client, first)
    second = create(client)
    artwork(client, second)
    page = client.get("/v1/reviews?limit=1&search=Actual", headers=headers()).json()
    assert len(page["items"]) == 1 and page["nextCursor"]
    next_page = client.get(
        "/v1/reviews",
        params={"limit": 1, "search": "Actual", "cursor": page["nextCursor"]},
        headers=headers(),
    ).json()
    assert len(next_page["items"]) == 1
    assert page["items"][0]["id"] != next_page["items"][0]["id"]
    assert "nextCursor" not in next_page
    assert (
        client.get(
            "/v1/reviews", params={"cursor": page["nextCursor"]}, headers=headers("bob")
        ).status_code
        == 422
    )
