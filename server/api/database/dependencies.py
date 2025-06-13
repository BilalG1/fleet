from typing import AsyncGenerator, Annotated, Callable, Awaitable, TypeVar, ParamSpec
from functools import wraps
from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from .settings import config

engine = create_async_engine(config.connection_string, connect_args={"server_settings": {"timezone": "UTC"}})
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

DbSession = Annotated[AsyncSession, Depends(get_session)]