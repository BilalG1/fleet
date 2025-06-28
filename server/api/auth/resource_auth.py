from typing import Annotated
from fastapi import Depends, HTTPException, Path
from sqlmodel.ext.asyncio.session import AsyncSession
from api.database.dependencies import DbSession
from api.database.models import Project, Task
from .dependencies import AuthenticatedUserId
import api.project.service as project_service
import api.task.service as task_service


async def get_authorized_project(
    project_id: Annotated[str, Path()],
    user_id: AuthenticatedUserId,
    db: DbSession,
) -> Project:
    """Dependency that verifies user owns the project and returns it"""
    project = await project_service.get(db, project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not authorized to access this project")
    return project


async def get_authorized_task(
    task_id: Annotated[str, Path()],
    user_id: AuthenticatedUserId,
    db: DbSession,
) -> tuple[Task, Project]:
    """Dependency that verifies user owns the task and returns task + project"""
    task = await task_service.get(db, task_id)
    project = await project_service.get_by_id(db, task.project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not authorized to access this task")
    return task, project


AuthorizedProject = Annotated[Project, Depends(get_authorized_project)]
AuthorizedTask = Annotated[tuple[Task, Project], Depends(get_authorized_task)]