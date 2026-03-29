from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.course import Course
from app.models.course_enrollment import CourseEnrollment
from app.models.assignment import Assignment
from app.models.user import User, UserRole
from app.services.student_repository_service import ensure_student_repository


async def create_course(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    title: str,
    description: str | None,
    grade_max: int,
) -> Course:
    course = Course(
        title=title,
        description=description,
        teacher_id=teacher_id,
        grade_max=grade_max,
    )
    session.add(course)
    await session.commit()
    await session.refresh(course)
    return course


async def list_teacher_courses(session: AsyncSession, *, teacher_id: UUID) -> list[Course]:
    result = await session.execute(
        select(Course).where(Course.teacher_id == teacher_id).order_by(Course.created_at.desc())
    )
    return list(result.scalars().all())


async def list_student_courses(session: AsyncSession, *, student_id: UUID) -> list[Course]:
    result = await session.execute(
        select(Course)
        .join(
            CourseEnrollment,
            CourseEnrollment.course_id == Course.id,
        )
        .where(CourseEnrollment.student_id == student_id)
        .order_by(Course.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_teacher_course(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    course_id: UUID,
) -> None:
    course_q = await session.execute(select(Course).where(Course.id == course_id))
    course = course_q.scalar_one_or_none()
    if not course:
        raise ValueError("Course not found")
    if course.teacher_id != teacher_id:
        raise PermissionError("Course not found or not owned by teacher")

    await session.delete(course)
    await session.commit()


async def enroll_student_to_course(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    course_id: UUID,
    student_id: UUID,
) -> CourseEnrollment:
    course_q = await session.execute(select(Course).where(Course.id == course_id))
    course = course_q.scalar_one_or_none()
    if not course or course.teacher_id != teacher_id:
        raise PermissionError("Course not found or not owned by teacher")

    student_q = await session.execute(select(User).where(User.id == student_id))
    student = student_q.scalar_one_or_none()
    if not student or student.role != UserRole.student:
        raise ValueError("Student not found")

    existing_q = await session.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student_id,
        )
    )
    existing = existing_q.scalar_one_or_none()
    if existing:
        return existing

    enrollment = CourseEnrollment(course_id=course_id, student_id=student_id)
    session.add(enrollment)

    # Для нового студента создаём персональные репозитории для всех заданий курса.
    assignments_q = await session.execute(select(Assignment.id).where(Assignment.course_id == course_id))
    assignment_ids = list(assignments_q.scalars().all())
    for assignment_id in assignment_ids:
        await ensure_student_repository(
            session,
            assignment_id=assignment_id,
            student_id=student_id,
        )

    await session.commit()
    await session.refresh(enrollment)
    return enrollment

