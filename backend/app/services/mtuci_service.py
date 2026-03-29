"""
Service for MTUCI LK integration - auto-fill student data
"""
from __future__ import annotations

from mtuci_private_api import Mtuci
from mtuci_private_api.errors import AuthError


class MTUCIServiceError(Exception):
    """Base error for MTUCI service"""
    pass


class MTUCIAuthError(MTUCIServiceError):
    """Authentication failed with MTUCI LK"""
    pass


async def fetch_student_info(mtuci_login: str, mtuci_password: str) -> dict:
    """
    Fetch student info from MTUCI LK using provided credentials.
    
    Returns dict with:
        - name: str - Full name
        - group: str - Group name
        - department: str - Faculty/department
        - course: str - Course number
        - speciality: str - Speciality
    
    Raises:
        MTUCIAuthError: If authentication fails
        MTUCIServiceError: If other errors occur
    """
    try:
        async with Mtuci(login=mtuci_login, password=mtuci_password) as client:
            user_info = await client.get_user_info()
            
            return {
                "name": user_info.name,
                "group": user_info.group,
                "department": user_info.department,
                "course": user_info.course,
                "speciality": user_info.speciality,
            }
    except AuthError as e:
        raise MTUCIAuthError(f"Invalid MTUCI credentials: {e}")
    except Exception as e:
        raise MTUCIServiceError(f"Failed to fetch student info: {e}")
