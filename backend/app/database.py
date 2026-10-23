import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def database_url():
    url = os.environ.get("DATABASE_URL", "postgresql+psycopg://localhost/wavelength").strip().strip("\"'")
    if url.startswith(("postgres://", "postgresql://")):
        url = "postgresql+psycopg://" + url.split("://", 1)[1]
    if not url.startswith("postgresql+psycopg://"):
        raise ValueError("DATABASE_URL must use PostgreSQL with the psycopg driver.")
    return url


engine = create_engine(
    database_url(),
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=2,
    pool_recycle=240,
    connect_args={"connect_timeout": 10},
)
Session = sessionmaker(engine, expire_on_commit=False)
