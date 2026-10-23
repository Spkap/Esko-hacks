from alembic import context
from app.database import Base, engine
import app.models  # noqa: F401 -- register tables for migration metadata


def run():
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()


run()
