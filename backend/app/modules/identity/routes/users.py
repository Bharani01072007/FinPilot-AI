"""User Management REST Controller Endpoints.

Provides administrative routes for User CRUD, search/filtering, status control, role assignments,
and session revocations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse, RoleResponse, UserResponse
from app.modules.identity.schemas.user import (
    AssignRoleRequest,
    UserCreateRequest,
    UserListResponse,
    UserSearchFilter,
    UserSessionResponse,
    UserUpdateRequest,
)
from app.modules.identity.services.user_management_service import user_mgmt_service

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get(
    "",
    response_model=APIResponse[UserListResponse],
    status_code=status.HTTP_200_OK,
    summary="List & Search Users",
    description="List active users with pagination, sorting, free-text search, and role/status filtering. (Admin, Manager, Employee)",
    dependencies=[Depends(RequireRoles("Admin", "Manager", "Employee"))],
)
def list_users(
    search: Optional[str] = Query(None, description="Free-text search across name, email, phone"),
    role: Optional[str] = Query(None, description="Filter by assigned role name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: str = Query("created_at", description="Sort field (created_at, email, first_name)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> APIResponse[UserListResponse]:
    filters = UserSearchFilter(
        search=search,
        role=role,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    result = user_mgmt_service.search_users(db, filters)
    return APIResponse(success=True, message="Users retrieved successfully", data=result)


@router.post(
    "",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create User Account",
    description="Create user account with role hierarchy validation. (Admin, Manager, Employee)",
    dependencies=[Depends(RequireRoles("Admin", "Manager", "Employee"))],
)
def create_user(
    req: UserCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    actor_roles = [ur.role.name.lower() for ur in current_user.user_roles if ur.role and ur.role.name]
    target_roles_lower = [r.lower() for r in req.roles]

    if "admin" not in actor_roles:
        if "manager" in actor_roles:
            if any(r in target_roles_lower for r in ["manager", "admin"]):
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Managers can only create Employee and Customer accounts")
        elif "employee" in actor_roles:
            if any(r in target_roles_lower for r in ["employee", "manager", "admin"]):
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Employees can only create Customer accounts")

    user = user_mgmt_service.create_user_by_admin(db, req, actor_id=current_user.id)
    return APIResponse(success=True, message="User created successfully", data=UserResponse.model_validate(user))


@router.get(
    "/{user_id}",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User By ID",
    description="Retrieve user profile details by ID. (Admin, Manager)",
    dependencies=[Depends(RequireRoles("Admin", "Manager"))],
)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.get_user_by_id(db, user_id)
    return APIResponse(success=True, message="User details retrieved successfully", data=UserResponse.model_validate(user))


@router.put(
    "/{user_id}",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Update User",
    description="Update profile information for target user. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def update_user(
    user_id: str,
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.update_user(db, user_id, req, actor_id=current_user.id)
    return APIResponse(success=True, message="User updated successfully", data=UserResponse.model_validate(user))


@router.delete(
    "/{user_id}",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Soft Delete User",
    description="Perform soft delete on user account and revoke active sessions. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    user_mgmt_service.soft_delete_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="User deleted successfully", data=None)


# --- Account Status Endpoints ---

@router.patch(
    "/{user_id}/activate",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Activate User",
    description="Activate user account. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def activate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.activate_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="User activated successfully", data=UserResponse.model_validate(user))


@router.patch(
    "/{user_id}/deactivate",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Deactivate User",
    description="Deactivate user account and revoke active sessions. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def deactivate_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.deactivate_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="User deactivated successfully", data=UserResponse.model_validate(user))


@router.patch(
    "/{user_id}/lock",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Lock Account",
    description="Lock user account for 15 minutes. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def lock_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.lock_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="Account locked successfully", data=UserResponse.model_validate(user))


@router.patch(
    "/{user_id}/unlock",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Unlock Account",
    description="Unlock locked user account. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def unlock_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.unlock_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="Account unlocked successfully", data=UserResponse.model_validate(user))


@router.patch(
    "/{user_id}/suspend",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Suspend Account",
    description="Suspend user account and revoke active sessions. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def suspend_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.suspend_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="User suspended successfully", data=UserResponse.model_validate(user))


@router.patch(
    "/{user_id}/restore",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Restore User",
    description="Restore soft-deleted user account. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def restore_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.restore_user(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="User restored successfully", data=UserResponse.model_validate(user))


# --- User Roles Endpoints ---

@router.get(
    "/{user_id}/roles",
    response_model=APIResponse[List[RoleResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get User Roles",
    description="List roles assigned to target user. (Admin, Manager)",
    dependencies=[Depends(RequireRoles("Admin", "Manager"))],
)
def get_user_roles(
    user_id: str,
    db: Session = Depends(get_db),
) -> APIResponse[List[RoleResponse]]:
    roles = user_mgmt_service.get_user_roles(db, user_id)
    return APIResponse(
        success=True,
        message="User roles retrieved successfully",
        data=[RoleResponse.model_validate(r) for r in roles],
    )


@router.post(
    "/{user_id}/roles",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Assign Role to User",
    description="Assign a role to target user avoiding duplicate assignments. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def assign_role(
    user_id: str,
    req: AssignRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.assign_role_to_user(db, user_id, req.role_name, actor_id=current_user.id)
    return APIResponse(success=True, message=f"Role '{req.role_name}' assigned successfully", data=UserResponse.model_validate(user))


@router.delete(
    "/{user_id}/roles/{role_id}",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Remove Role from User",
    description="Remove role assignment from target user. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def remove_role(
    user_id: str,
    role_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = user_mgmt_service.remove_role_from_user(db, user_id, role_id, actor_id=current_user.id)
    return APIResponse(success=True, message="Role removed successfully", data=UserResponse.model_validate(user))


# --- User Sessions Endpoints ---

@router.get(
    "/{user_id}/sessions",
    response_model=APIResponse[List[UserSessionResponse]],
    status_code=status.HTTP_200_OK,
    summary="View Active User Sessions",
    description="List active authentication sessions for target user. (Admin, Manager)",
    dependencies=[Depends(RequireRoles("Admin", "Manager"))],
)
def get_user_sessions(
    user_id: str,
    db: Session = Depends(get_db),
) -> APIResponse[List[UserSessionResponse]]:
    sessions = user_mgmt_service.get_user_sessions(db, user_id)
    return APIResponse(
        success=True,
        message="User sessions retrieved successfully",
        data=[UserSessionResponse.model_validate(s) for s in sessions],
    )


@router.delete(
    "/{user_id}/sessions/{session_id}",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Revoke Single Session",
    description="Revoke specific active session for target user. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def revoke_user_session(
    user_id: str,
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    user_mgmt_service.revoke_user_session_by_admin(db, user_id, session_id, actor_id=current_user.id)
    return APIResponse(success=True, message="Session revoked successfully", data=None)


@router.delete(
    "/{user_id}/sessions",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Revoke All User Sessions",
    description="Revoke all active sessions across all devices for target user. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def revoke_all_user_sessions(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    user_mgmt_service.revoke_all_user_sessions_by_admin(db, user_id, actor_id=current_user.id)
    return APIResponse(success=True, message="All user sessions revoked successfully", data=None)
