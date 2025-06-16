import uuid
from datetime import datetime
from typing import Any, Literal
from sqlmodel import SQLModel, Field, JSON, Column, String
from .utils import utc_now


class Project(SQLModel, table=True):
    id: int = Field(primary_key=True, default=None)
    external_id: str = Field(unique=True, index=True, default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    repo_id: int
    repo_name: str
    repo_html_url: str
    repo_clone_url: str
    rules_file_path: str = Field(default="")
    setup_script_path: str = Field(default="")
    created_at: datetime = Field(default_factory=utc_now)


class Task(SQLModel, table=True):
    id: int = Field(primary_key=True, default=None)
    external_id: str = Field(unique=True, index=True, default_factory=lambda: str(uuid.uuid4()))
    project_id: int = Field(foreign_key="project.id")
    title: str = Field(default="")
    description: str
    status: Literal["running", "pending_review", "completed"] = Field(default="running", sa_column=Column(String()))
    sandbox_id: str | None = Field(default=None)
    sandbox_state: Literal["running", "paused"] = Field(default="paused", sa_column=Column(String()))
    last_used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)


class Message(SQLModel, table=True):
    id: int = Field(primary_key=True, default=None)
    external_id: str = Field(unique=True, index=True, default_factory=lambda: str(uuid.uuid4()))
    task_id: int = Field(foreign_key="task.id")
    role: Literal["user", "assistant"] = Field(sa_column=Column(String()))
    message_order: int
    created_at: datetime = Field(default_factory=utc_now)


class ContentBlock(SQLModel, table=True):
    id: int = Field(primary_key=True, default=None)
    message_id: int = Field(foreign_key="message.id")
    block_type: str  # 'text', 'tool_input', 'tool_result'
    sequence_number: int  # Order within the message
    tool_id: str | None = Field(default=None)  # For tool blocks
    tool_name: str | None = Field(default=None)  # For tool_input blocks
    content: dict[str, Any] = Field(sa_column=Column(JSON))  # JSON field for flexible content
    is_error: bool = Field(default=False)  # For tool_result blocks
    created_at: datetime = Field(default_factory=utc_now)