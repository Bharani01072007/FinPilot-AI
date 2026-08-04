"""Document Vault REST Controller Endpoints.

Provides API routes for customer reusable document vault management.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.documents.schemas.document import DocumentVaultRequest, DocumentVaultResponse
from app.modules.documents.services.document_service import doc_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/document-vault", tags=["Document Vault"])


@router.get(
    "",
    response_model=APIResponse[List[DocumentVaultResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Customer Document Vault",
    description="Retrieve reusable documents saved in Customer Document Vault.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_vault(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[List[DocumentVaultResponse]]:
    items = doc_service.get_vault_items(db, customer_id, current_user)
    return APIResponse(success=True, message="Document vault items retrieved successfully", data=items)


@router.post(
    "",
    response_model=APIResponse[DocumentVaultResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Link Document to Vault",
    description="Link a verified customer document to the Document Vault for reuse across future applications.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def add_to_vault(
    req: DocumentVaultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentVaultResponse]:
    vault = doc_service.add_to_vault(db, req, current_user)
    return APIResponse(success=True, message="Document linked to vault successfully", data=vault)


@router.get(
    "/{id}",
    response_model=APIResponse[DocumentVaultResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Vault Item Details",
    description="Retrieve details for a single Document Vault item.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_vault_item(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentVaultResponse]:
    vault = doc_service.doc_repo.get_vault_by_id(db, id)
    if not vault:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(message="Vault record not found")
    res = DocumentVaultResponse.model_validate(vault)
    if vault.document:
        res.document = doc_service._enrich_document_urls(vault.document)
    return APIResponse(success=True, message="Vault item details retrieved successfully", data=res)
