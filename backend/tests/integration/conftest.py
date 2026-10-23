import os
import io
from datetime import datetime, timedelta, timezone
import jwt
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.database import engine, Base
from app.api.main import app


@pytest.fixture(autouse=True)
def database(monkeypatch, tmp_path):
    if engine.dialect.name != "postgresql":
        pytest.skip("Real PostgreSQL required for integration tests")
    if "test" not in str(engine.url.database):
        pytest.fail("Tests require a disposable database with test in its name")
    monkeypatch.setenv(
        "WAVELENGTH_JWT_SECRET", "test-only-8fc210bd786947eaa40ecc75c4ea852c"
    )
    monkeypatch.setenv("WAVELENGTH_STORAGE_DIR", str(tmp_path / "private-files"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def headers(user="alice"):
    token = jwt.encode(
        dict(
            sub=user,
            iss="wavelength-local",
            aud="wavelength-api",
            exp=datetime.now(timezone.utc) + timedelta(hours=1),
        ),
        os.environ["WAVELENGTH_JWT_SECRET"],
        algorithm="HS256",
    )
    return {"Authorization": "Bearer " + token}


def create(client, user="alice"):
    return client.post(
        "/v1/reviews",
        headers=headers(user),
        json={
            "productName": "Actual upload",
            "market": "Japan",
            "category": "beverage",
        },
    ).json()


def artwork(client, review, user="alice"):
    image = io.BytesIO()
    Image.new("RGB", (80, 100), "white").save(image, "PNG")
    return client.post(
        f"/v1/reviews/{review['id']}/artworks",
        headers=headers(user),
        files={"file": ("actual.png", image.getvalue(), "image/png")},
    )


def start(client, review, art, key="request-1", user="alice"):
    return client.post(
        "/v1/runs",
        headers=headers(user),
        json=dict(
            reviewId=review["id"],
            artworkVersionId=art["id"],
            referenceIds=[],
            ruleSetVersion="wavelength-core-v1",
            selectedRuleIds=["net-quantity"],
            requestKey=key,
        ),
    )
