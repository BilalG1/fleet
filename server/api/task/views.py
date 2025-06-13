from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from api.auth.dependencies import AuthenticatedUserId
import api.project.service as project_service
import api.task.service as task_service
from api.llm.service import generate_title
from api.database.dependencies import DbSession, async_session
import api.task.queue_service as queue_service
from api.database.models import Task
from .models import TaskCreate, TaskPublic, TaskEvent, TextBlock, MessagePublic, MessageCreate, create_message_param_from_message
from .flows import start_task_flow, run_agent_flow

router = APIRouter(prefix="/task")


@router.post("")
async def create_task(
    task_data: TaskCreate,
    user_id: AuthenticatedUserId,
    db: DbSession,
    background_tasks: BackgroundTasks
) -> str:
    project = await project_service.get(db, task_data.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to create tasks for this project")
    
    task = await task_service.create(
        db, 
        project.id, 
        task_data.description
    )
    
    # Save initial user message to database
    user_message = await task_service.create_message(
        db, task.id, "user", 0
    )
    await task_service.save_content_blocks(
        db, user_message.id, [TextBlock(text=task_data.description)]
    )
    
    async def generate_task_title_background(task: Task) -> None:
        generated_title = await generate_title(task.description)
        async with async_session() as session:
            await task_service.update_title(session, task.external_id, generated_title)
    
    background_tasks.add_task(generate_task_title_background, task)
    background_tasks.add_task(
        start_task_flow, 
        task, 
        project, 
        task_data.gh_access_token
    )
    queue_service.create(task.id)
    return task.external_id


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    user_id: AuthenticatedUserId,
    db: DbSession
) -> TaskPublic:
    task = await task_service.get(db, task_id)
    project = await project_service.get_by_id(db, task.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to access this task")
    
    return TaskPublic.from_task(task) 


@router.post("/{task_id}/events")
async def read_events(
    task_id: str,
    user_id: AuthenticatedUserId,
    db: DbSession,
) -> TaskEvent:
    task = await task_service.get(db, task_id)
    project = await project_service.get_by_id(db, task.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to access this task")

    return StreamingResponse(
        queue_service.stream_response(task.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    ) # type: ignore


@router.get("/{task_id}/messages")
async def get_messages(
    task_id: str,
    user_id: AuthenticatedUserId,
    db: DbSession,
) -> list[MessagePublic]:
    task = await task_service.get(db, task_id)
    project = await project_service.get_by_id(db, task.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to access this task")
    
    messages_and_blocks = await task_service.get_messages_for_task(db, task.id)
    return [MessagePublic.from_message_and_blocks(message, blocks) for message, blocks in messages_and_blocks]


@router.post("/{task_id}/messages")
async def create_message(
    task_id: str,
    user_id: AuthenticatedUserId,
    db: DbSession,
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
) -> None:
    task = await task_service.get(db, task_id)
    project = await project_service.get_by_id(db, task.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to access this task")
    
    message = await task_service.create_message(db, task.id, "user", 0)
    await task_service.save_content_blocks(db, message.id, [TextBlock(text=message_data.text)])
    messages_and_blocks = await task_service.get_messages_for_task(db, task.id)
    message_params = [
        create_message_param_from_message(message, blocks) 
        for message, blocks in messages_and_blocks
    ]
    background_tasks.add_task(run_agent_flow, task, message_params)