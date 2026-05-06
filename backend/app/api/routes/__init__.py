from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.courses import router as courses_router
from app.api.routes.groups import router as groups_router
from app.api.routes.repositories import router as repositories_router
from app.api.routes.roles import router as roles_router
from app.api.routes.stats import router as stats_router
from app.api.routes.users import router as users_router
from app.api.routes.webhooks import router as webhooks_router

__all__ = [
    "admin_router",
    "auth_router",
    "courses_router",
    "groups_router",
    "repositories_router",
    "roles_router",
    "stats_router",
    "users_router",
    "webhooks_router",
]
