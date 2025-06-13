import asyncio
from typing import AsyncGenerator
from .models import TaskEvent, create_task_event_from_anthropic, ErrorEvent
from anthropic.lib.streaming._types import MessageStreamEvent

_queues: dict[int, asyncio.Queue[TaskEvent]] = {}


def create(task_id: int) -> None:
    if task_id not in _queues:
        _queues[task_id] = asyncio.Queue()


async def push(task_id: int, event: TaskEvent) -> None:
    if task_id not in _queues:
        _queues[task_id] = asyncio.Queue()
    
    await _queues[task_id].put(event)


async def push_message_stream_event(task_id: int, event: MessageStreamEvent) -> None:
    task_event = create_task_event_from_anthropic(event)
    if task_event is not None:
        await push(task_id, task_event)


async def stream(task_id: int) -> AsyncGenerator[TaskEvent, None]:
    queue = _queues.get(task_id)
    if queue is None:
        return
    while True:
        try:
            item = await queue.get()
            yield item
        except asyncio.QueueShutDown:
            break


async def stream_response(task_id: int) -> AsyncGenerator[str, None]:
    try:
        async for task_event in stream(task_id):
            yield f"data: {task_event.model_dump_json()}\n\n"
    except Exception as e:
        error_event = ErrorEvent(type="error", error_message=str(e))
        yield f"data: {error_event.model_dump_json()}\n\n"


        