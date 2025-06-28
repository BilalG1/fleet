from fastapi import APIRouter
from api.database.dependencies import DbSession
from api.auth.dependencies import AuthenticatedUserId
from api.auth.resource_auth import AuthorizedProject
from github import Github, Auth
from api.task.models import TaskPublic
import api.task.service as task_service
from .service import create, update_settings, get_all
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
    rules_file: str,
    setup_script: str,
    project: AuthorizedProject,
    db: DbSession
) -> None:
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
    project: AuthorizedProject,
    db: DbSession,
) -> list[TaskPublic]:
    tasks = await task_service.get_all_for_project(db, project.id)
    return [TaskPublic.from_task(task) for task in tasks]