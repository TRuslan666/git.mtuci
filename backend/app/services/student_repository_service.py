from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_repository import StudentRepository
from app.services.gitea_service import create_repo


def build_student_repo_name(*, assignment_id: UUID, student_id: UUID) -> str:
    return f"assignment_{assignment_id}_student_{student_id}"


async def ensure_student_repository(
    session: AsyncSession,
    *,
    assignment_id: UUID,
    student_id: UUID,
) -> StudentRepository:
    existing_q = await session.execute(
        select(StudentRepository).where(
            StudentRepository.assignment_id == assignment_id,
            StudentRepository.student_id == student_id,
        )
    )
    existing = existing_q.scalar_one_or_none()
    if existing:
        return existing

    repo_name = build_student_repo_name(assignment_id=assignment_id, student_id=student_id)
    await create_repo(repo_name)

    record = StudentRepository(
        assignment_id=assignment_id,
        student_id=student_id,
        repo_name=repo_name,
    )
    session.add(record)
    await session.flush()
    return record


async def get_student_repo_name(
    session: AsyncSession,
    *,
    assignment_id: UUID,
    student_id: UUID,
) -> str:
    repo_q = await session.execute(
        select(StudentRepository).where(
            StudentRepository.assignment_id == assignment_id,
            StudentRepository.student_id == student_id,
        )
    )
    repo = repo_q.scalar_one_or_none()
    if not repo:
        raise ValueError("Student repository not found")
    return repo.repo_name
