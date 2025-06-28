from datetime import timedelta
from sqlalchemy import cast, DateTime
from typing import Sequence, Literal
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, desc
from api.database.models import Task, Message, ContentBlock
from api.database.base_service import BaseService
from .models import ContentBlock as ContentBlockModel
from api.database.utils import utc_now


async def create(
    session: AsyncSession,
    project_id: int,
    description: str,
) -> Task:
    task = Task(
        project_id=project_id,
        description=description,
    )
    return await BaseService.create(session, task)


async def get(
    session: AsyncSession,
    external_task_id: str,
) -> Task:
    return await BaseService.get_by_external_id(
        session, 
        Task, 
        external_task_id,
        not_found_message="Task not found"
    )


async def get_all_for_project(
    session: AsyncSession,
    project_id: int,
) -> Sequence[Task]:
    return await BaseService.get_many(
        session, 
        Task, 
        filters={"project_id": project_id},
        order_by="created_at"
    )


async def update_title(
    session: AsyncSession,
    external_task_id: str,
    title: str,
) -> Task:
    task = await get(session, external_task_id)
    return await BaseService.update(session, task, title=title)


async def update_sandbox_id(
    session: AsyncSession,
    task_id: int,
    sandbox_id: str,
) -> None:
    query = select(Task).where(Task.id == task_id)
    task = (await session.exec(query)).one()
    task.sandbox_id = sandbox_id
    await session.commit()


async def update_sandbox_usage(
    session: AsyncSession,
    task_id: int,
    sandbox_state: Literal["running", "paused"] = "running",
) -> None:
    query = select(Task).where(Task.id == task_id)
    task = (await session.exec(query)).one()
    task.sandbox_state = sandbox_state
    task.last_used_at = utc_now()
    await session.commit()


async def get_idle_sandboxes(
    session: AsyncSession,
    idle_minutes: int = 5,
) -> Sequence[Task]:
    """Get tasks with sandboxes that have been idle for more than idle_minutes"""
    cutoff_time = utc_now() - timedelta(minutes=idle_minutes)
    query = (
        select(Task)
        .where(Task.sandbox_id != None)
        .where(Task.sandbox_state == "running")
        .where(Task.last_used_at != None)
        .where(cast(Task.last_used_at, DateTime) < cutoff_time)
    )
    return (await session.exec(query)).all()


async def create_message(
    session: AsyncSession,
    task_id: int,
    role: Literal["user", "assistant"],
    message_order: int,
) -> Message:
    message = Message(
        task_id=task_id,
        role=role,
        message_order=message_order,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def save_content_blocks(
    session: AsyncSession,
    message_id: int,
    content_blocks: Sequence[ContentBlockModel],
) -> None:
    for sequence_number, block in enumerate(content_blocks):
        if block.type == "text":
            db_block = ContentBlock(
                message_id=message_id,
                block_type="text",
                sequence_number=sequence_number,
                content={"text": block.text},
            )
        elif block.type == "tool_input":
            db_block = ContentBlock(
                message_id=message_id,
                block_type="tool_input",
                sequence_number=sequence_number,
                tool_id=block.tool_id,
                tool_name=block.tool_name,
                content={"tool_input": block.tool_input if isinstance(block.tool_input, str) else block.tool_input.model_dump()},
            )
        elif block.type == "tool_result":
            db_block = ContentBlock(
                message_id=message_id,
                block_type="tool_result",
                sequence_number=sequence_number,
                tool_id=block.tool_id,
                content={"tool_result": block.tool_result},
                is_error=block.is_error,
            )
        else:
            continue
        session.add(db_block)
    
    await session.commit()


async def get_messages_for_task(
    session: AsyncSession,
    task_id: int,
) -> list[tuple[Message, list[ContentBlock]]]:
    query = (
        select(Message, ContentBlock)
        .where(Message.task_id == task_id)
        .join(ContentBlock, ContentBlock.message_id == Message.id) # type: ignore
        .order_by(Message.id, ContentBlock.sequence_number) # type: ignore
    )
    results = (await session.exec(query)).all()

    grouped: dict[int, tuple[Message, list[ContentBlock]]] = {}
    for message, block in results:
        if message.id not in grouped:
            grouped[message.id] = (message, [])
        grouped[message.id][1].append(block)

    return list(grouped.values())


async def get_tasks(
    session: AsyncSession,
    project_id: int,
) -> Sequence[Task]:
    query = (
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(desc(Task.created_at))
    )
    return (await session.exec(query)).all()


async def update_status(
    session: AsyncSession,
    task_id: int,
    status: Literal["running", "pending_review", "completed"],
) -> None:
    query = select(Task).where(Task.id == task_id)
    task = (await session.exec(query)).one()
    current_status = task.status
    valid_transitions = {
        "running": ["pending_review"],
        "pending_review": ["running"],
        "completed": []  # completed is final
    }
    
    if status not in valid_transitions.get(current_status, []):
        print(f"Warning: Invalid status transition from {current_status} to {status} for task {task_id}")
        return
    
    task.status = status
    await session.commit()