from conftest import headers, create, artwork, start


def test_two_user_isolation(client):
    review = create(client)
    art = artwork(client, review).json()
    run = start(client, review, art).json()
    for path in [
        f"/v1/reviews/{review['id']}",
        art["url"],
        f"/v1/runs/{run['id']}",
        f"/v1/runs/{run['id']}/report",
    ]:
        assert client.get(path, headers=headers("bob")).status_code == 404
    assert (
        client.post(f"/v1/runs/{run['id']}/cancel", headers=headers("bob")).status_code
        == 404
    )
    assert artwork(client, review, "bob").status_code == 404
    assert client.get("/v1/reviews", headers=headers("bob")).json()["items"] == []
    assert client.get(art["url"]).status_code == 401
