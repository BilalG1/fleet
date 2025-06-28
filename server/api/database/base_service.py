from typing import TypeVar, Type, Optional, Sequence, Any
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi import HTTPException
from sqlalchemy.exc import NoResultFound, IntegrityError

T = TypeVar('T', bound=SQLModel)


class BaseService:
    """Base service class with common CRUD operations and error handling"""
    
    @staticmethod
    async def get_by_id(
        session: AsyncSession, 
        model_class: Type[T], 
        id_value: Any,
        id_field: str = "id",
        not_found_message: Optional[str] = None
    ) -> T:
        """Get a single record by ID with proper error handling"""
        try:
            query = select(model_class).where(getattr(model_class, id_field) == id_value)
            result = await session.exec(query)
            return result.one()
        except NoResultFound:
            entity_name = model_class.__name__.lower()
            message = not_found_message or f"{entity_name.capitalize()} not found"
            raise HTTPException(status_code=404, detail=message)
    
    @staticmethod
    async def get_by_external_id(
        session: AsyncSession,
        model_class: Type[T],
        external_id: str,
        not_found_message: Optional[str] = None
    ) -> T:
        """Get a single record by external_id with proper error handling"""
        return await BaseService.get_by_id(
            session, model_class, external_id, "external_id", not_found_message
        )
    
    @staticmethod
    async def create(
        session: AsyncSession,
        instance: T,
        conflict_message: Optional[str] = None
    ) -> T:
        """Create a new record with proper error handling"""
        try:
            session.add(instance)
            await session.commit()
            await session.refresh(instance)
            return instance
        except IntegrityError as e:
            await session.rollback()
            message = conflict_message or "Resource already exists or constraint violation"
            raise HTTPException(status_code=409, detail=message) from e
    
    @staticmethod
    async def update(
        session: AsyncSession,
        instance: T,
        **updates: Any
    ) -> T:
        """Update a record with proper error handling"""
        try:
            for field, value in updates.items():
                if hasattr(instance, field):
                    setattr(instance, field, value)
            await session.commit()
            await session.refresh(instance)
            return instance
        except IntegrityError as e:
            await session.rollback()
            raise HTTPException(status_code=409, detail="Update conflict") from e
    
    @staticmethod
    async def get_many(
        session: AsyncSession,
        model_class: Type[T],
        filters: Optional[dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None
    ) -> Sequence[T]:
        """Get multiple records with optional filtering and ordering"""
        query = select(model_class)
        
        if filters:
            for field, value in filters.items():
                if hasattr(model_class, field):
                    query = query.where(getattr(model_class, field) == value)
        
        if order_by and hasattr(model_class, order_by):
            query = query.order_by(getattr(model_class, order_by))
        
        if limit:
            query = query.limit(limit)
        
        result = await session.exec(query)
        return result.all()