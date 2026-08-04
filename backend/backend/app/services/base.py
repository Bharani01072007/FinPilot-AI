"""Base Service Abstract Class.

Encapsulates application business logic separating domain rules from HTTP/API layers.
"""

from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Generic Base Service encapsulating business operations and repository interactions."""

    def __init__(self, repository: BaseRepository[ModelType, CreateSchemaType, UpdateSchemaType]):
        """Initialize service with a generic repository instance."""
        self.repository = repository

    def get_by_id(self, db: Session, id: str) -> Optional[ModelType]:
        """Retrieve entity by ID."""
        return self.repository.get(db, id=id)

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Retrieve paginated list of entities."""
        return self.repository.get_multi(db, skip=skip, limit=limit)

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        """Create new entity."""
        return self.repository.create(db, obj_in=obj_in)

    def update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        """Update existing entity."""
        return self.repository.update(db, db_obj=db_obj, obj_in=obj_in)

    def delete(self, db: Session, id: str) -> Optional[ModelType]:
        """Delete entity by ID."""
        return self.repository.remove(db, id=id)
