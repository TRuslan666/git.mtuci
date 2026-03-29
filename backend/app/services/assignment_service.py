from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment
from app.models.course import Course
from app.models.course_enrollment import CourseEnrollment
from app.models.user import User, UserRole
from app.services.student_repository_service import ensure_student_repository


async def create_assignment(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    course_id: UUID,
    title: str,
    description: str | None,
    start_date: datetime,
    deadline: datetime,
    late_penalty_periods: list[dict[str, int]],
) -> Assignment:
    course_q = await session.execute(select(Course).where(Course.id == course_id))
    course = course_q.scalar_one_or_none()
    if not course or course.teacher_id != teacher_id:
        raise PermissionError("Course not found or not owned by teacher")
    if start_date > deadline:
        raise ValueError("start_date must be less than or equal to deadline")
    for p in late_penalty_periods:
        weeks = int(p.get("weeks", 0))
        max_grade = int(p.get("max_grade", -1))
        if weeks <= 0:
            raise ValueError("late_penalty_periods.weeks must be > 0")
        if max_grade < 0:
            raise ValueError("late_penalty_periods.max_grade must be >= 0")

    assignment_id = uuid4()

    # Создаём запись задания.
    assignment = Assignment(
        id=assignment_id,
        course_id=course_id,
        title=title,
        description=description,
        start_date=start_date,
        deadline=deadline,
        late_penalty_periods=late_penalty_periods,
        gitea_repo_name=None,
    )

    session.add(assignment)
    await session.flush()

    # Для нового задания создаём персональный репозиторий каждому текущему студенту курса.
    enrolled_q = await session.execute(
        select(CourseEnrollment.student_id).where(CourseEnrollment.course_id == course_id)
    )
    enrolled_student_ids = list(enrolled_q.scalars().all())
    for student_id in enrolled_student_ids:
        await ensure_student_repository(
            session,
            assignment_id=assignment.id,
            student_id=student_id,
        )

    await session.commit()
    await session.refresh(assignment)
    return assignment


async def list_assignments_for_teacher(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    course_id: UUID,
) -> list[Assignment]:
    course_q = await session.execute(select(Course).where(Course.id == course_id))
    course = course_q.scalar_one_or_none()
    if not course or course.teacher_id != teacher_id:
        raise PermissionError("Course not found or not owned by teacher")

    result = await session.execute(
        select(Assignment)
        .where(Assignment.course_id == course_id)
        .order_by(Assignment.deadline.asc())
    )
    return list(result.scalars().all())


async def list_assignments_for_student(
    session: AsyncSession,
    *,
    student_id: UUID,
    course_id: UUID,
) -> list[Assignment]:
    enrollment_q = await session.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student_id,
        )
    )
    enrollment = enrollment_q.scalar_one_or_none()
    if not enrollment:
        raise PermissionError("Not enrolled")

    result = await session.execute(
        select(Assignment)
        .where(Assignment.course_id == course_id)
        .order_by(Assignment.deadline.asc())
    )
    return list(result.scalars().all())

