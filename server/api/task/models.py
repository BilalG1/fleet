from datetime import datetime
import uuid
from anthropic.types import (
    MessageParam, 
    TextBlockParam,
    ToolUseBlockParam,
    ToolResultBlockParam,
)
from pydantic import BaseModel, Field
from typing import Literal, Union
from api.database.models import Task, Message, ContentBlock as ContentBlockModel
from anthropic.lib.streaming._types import MessageStreamEvent
from api.agent_tools.models import ToolInputBlock, ToolResultBlock


class MessageCreate(BaseModel):
    text: str


class TaskCreate(BaseModel):
    description: str
    project_id: str
    gh_access_token: str


class TaskPublic(BaseModel):
    id: str
    title: str
    description: str
    created_at: datetime
    status: Literal["running", "pending_review", "completed"]

    @classmethod
    def from_task(cls, task: Task) -> "TaskPublic":
        return cls(
            id=task.external_id,
            title=task.title,
            description=task.description,
            created_at=task.created_at,
            status=task.status,
        )


class MessageStartEvent(BaseModel):
    type: Literal["message_start"] = "message_start"
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class MessageStopEvent(BaseModel):
    type: Literal["message_stop"] = "message_stop"


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    error_message: str


class TextDeltaEvent(BaseModel):  # Streaming only
    type: Literal["text_delta"] = "text_delta"
    text: str


class TextBlock(BaseModel):  # DB storage only
    type: Literal["text"] = "text"
    text: str


TaskEvent = Union[MessageStartEvent, MessageStopEvent, ErrorEvent, ToolInputBlock, ToolResultBlock, TextDeltaEvent]
# DB storage blocks
ContentBlock = Union[ToolInputBlock, ToolResultBlock, TextBlock]


def create_task_event_from_anthropic(anthropic_event: MessageStreamEvent) -> TaskEvent | None:
    if anthropic_event.type == "message_start":
        return MessageStartEvent(message_id=anthropic_event.message.id)
    if anthropic_event.type == "content_block_delta":
        delta = anthropic_event.delta
        if hasattr(delta, 'type') and delta.type == "text_delta":
            return TextDeltaEvent(text=delta.text)
    elif anthropic_event.type == "message_stop":
        return MessageStopEvent()
    return None


def create_content_block_from_db(block: ContentBlockModel) -> ContentBlock:
    if block.block_type == "text":
        return TextBlock(text=block.content.get("text", ""))
    elif block.block_type == "tool_input":
        return ToolInputBlock(
            tool_id=block.tool_id,
            tool_name=block.tool_name,
            tool_input={ **block.content.get("tool_input", {}), "tool_name": block.tool_name }
        ) # type: ignore
    elif block.block_type == "tool_result":
        return ToolResultBlock(
            tool_id=block.tool_id, 
            tool_result=block.content.get("tool_result", ""), 
            is_error=block.is_error
        )
    raise ValueError(f"Unknown block type: {block.block_type}")


class MessagePublic(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: list[ContentBlock]

    @classmethod
    def from_message_and_blocks(cls, message: Message, blocks: list[ContentBlockModel]) -> "MessagePublic":
        return cls(
            id=message.external_id,
            role=message.role,
            content=[create_content_block_from_db(block) for block in blocks]
        )
    

def create_anthropic_message_content_from_db(block: ContentBlockModel) -> ToolUseBlockParam | ToolResultBlockParam | TextBlockParam:
    if block.block_type == "text":
        return TextBlockParam(text=block.content.get("text", ""), type="text")
    elif block.block_type == "tool_input":
        return ToolUseBlockParam(
            id=block.tool_id or "",
            input=block.content.get("tool_input", {}),
            name=block.tool_name or "",
            type="tool_use"
        )
    elif block.block_type == "tool_result":
        return ToolResultBlockParam(
            tool_use_id=block.tool_id or "",
            content=block.content.get("tool_result", ""),
            type="tool_result"
        )
    raise ValueError(f"Unknown block type: {block.block_type}")


def create_message_param_from_message(message: Message, blocks: list[ContentBlockModel]) -> MessageParam:
    return {
        "role": message.role,
        "content": [create_anthropic_message_content_from_db(block) for block in blocks]
    }