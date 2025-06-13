from fastapi import APIRouter, HTTPException
from api.database.dependencies import DbSession
from api.auth.dependencies import AuthenticatedUserId
from github import Github, Auth
from api.task.models import TaskPublic
import api.task.service as task_service
from .service import get, create, update_settings, get_all
from .models import ProjectPublic

router = APIRouter(prefix="/project")


@router.post("")
async def create_project(
    repo_id: int, 
    gh_token: str, 
    user_id: AuthenticatedUserId,
    db: DbSession
) -> str:
    auth = Auth.Token(gh_token)
    g = Github(auth=auth)
    repo = g.get_repo(repo_id)
    project_id = await create(
        db, 
        user_id, 
        repo.id, 
        repo.name, 
        repo.html_url, 
        repo.clone_url
    )
    return project_id


@router.post("/{project_id}/settings")
async def update_project_settings(
    project_id: str,
    rules_file: str,
    setup_script: str,
    user_id: AuthenticatedUserId,
    db: DbSession
) -> None:
    project = await get(db, project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    await update_settings(db, project, rules_file, setup_script)


@router.get("")
async def get_projects(
    user_id: AuthenticatedUserId,
    db: DbSession
) -> list[ProjectPublic]:
    projects = await get_all(db, user_id)
    return [ProjectPublic.from_project(project) for project in projects]


@router.get("/{project_id}/tasks")
async def get_tasks(
    project_id: str,
    user_id: AuthenticatedUserId,
    db: DbSession,
) -> list[TaskPublic]:
    project = await get(db, project_id)
    if project.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    tasks = await task_service.get_tasks(db, project.id)
    return [TaskPublic.from_task(task) for task in tasks]