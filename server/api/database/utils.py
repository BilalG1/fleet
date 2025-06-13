from typing import TypeVar
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload as sqlalchemy_selectinload, InstrumentedAttribute
from sqlalchemy import (
    Column,
    ColumnClause,
)
from sqlalchemy.sql.base import ExecutableOption

_T = TypeVar("_T")


def selectinload(column_expression: _T) -> ExecutableOption:
    if not isinstance(column_expression, (ColumnClause, Column, InstrumentedAttribute)):
        raise RuntimeError(f"Not a SQLAlchemy column: {column_expression}")
    attr: InstrumentedAttribute[_T] = column_expression # type: ignore
    return sqlalchemy_selectinload(attr)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)