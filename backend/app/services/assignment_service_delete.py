async def delete_assignment(
    session: AsyncSession,
    *,
    teacher_id: UUID,
    course_id: UUID,
    assignment_id: UUID,
) -> None:
    """Delete assignment if teacher owns the course."""
    from app.models.course import Course
    from app.models.repository import StudentRepository
    from app.models.submission import Submission
    from sqlalchemy import delete
    
    # Check course exists and teacher owns it
    course_q = await session.execute(
        select(Course).where(Course.id == course_id, Course.teacher_id == teacher_id)
    )
    course = course_q.scalar_one_or_none()
    if not course:
        raise PermissionError("Course not found or teacher access only")
    
    # Check assignment exists in this course
    assignment_q = await session.execute(
        select(Assignment).where(
            Assignment.id == assignment_id,
            Assignment.course_id == course_id,
        )
    )
    assignment = assignment_q.scalar_one_or_none()
    if not assignment:
        raise ValueError("Assignment not found")
    
    # Delete related student repositories first
    await session.execute(
        delete(StudentRepository).where(StudentRepository.assignment_id == assignment_id)
    )
    
    # Delete related submissions
    await session.execute(
        delete(Submission).where(Submission.assignment_id == assignment_id)
    )
    
    # Delete the assignment
    await session.execute(delete(Assignment).where(Assignment.id == assignment_id))
    await session.commit()
