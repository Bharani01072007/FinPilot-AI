"""Role Management REST Controller Endpoints.

Provides API routes for listing system roles.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.identity.dependencies import RequireRoles
from app.modules.identity.schemas.auth import APIResponse, RoleResponse
from app.modules.identity.services.user_management_service import user_mgmt_service

router = APIRouter(prefix="/roles", tags=["Role Management"])


@router.get(
    "",
    response_model=APIResponse[List[RoleResponse]],
    status_code=status.HTTP_200_OK,
    summary="List System Roles",
    description="List all available system roles (Customer, Employee, Manager, Admin). (Admin, Manager)",
    dependencies=[Depends(RequireRoles("Admin", "Manager"))],
)
def list_roles(
    db: Session = Depends(get_db),
) -> APIResponse[List[RoleResponse]]:
    roles = user_mgmt_service.list_roles(db)
    return APIResponse(
        success=True,
        message="Roles retrieved successfully",
        data=[RoleResponse.model_validate(r) for r in roles],
    )
