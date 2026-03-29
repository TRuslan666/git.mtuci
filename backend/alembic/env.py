from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.models.base import Base

# Импорт модели гарантирует, что она зарегистрируется в metadata
from app.models import user as _user_model  # noqa: F401
from app.models import course as _course_model  # noqa: F401
from app.models import course_enrollment as _course_enrollment_model  # noqa: F401
from app.models import assignment as _assignment_model  # noqa: F401
from app.models import submission as _submission_model  # noqa: F401
from app.models import student_repository as _student_repository_model  # noqa: F401
from app.models import password_reset_token as _password_reset_token_model  # noqa: F401


config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        render_as_batch=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())

