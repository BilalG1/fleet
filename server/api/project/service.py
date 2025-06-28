from typing import Sequence
from sqlmodel.ext.asyncio.session import AsyncSession
from api.database.models import Project
from api.database.base_service import BaseService


async def create(
    session: AsyncSession,
    user_id: str,
    repo_id: int, 
    repo_name: str,
    repo_html_url: str,
    repo_clone_url: str,
) -> str:
    project = Project(
        repo_id=repo_id,
        repo_name=repo_name,
        repo_html_url=repo_html_url,
        repo_clone_url=repo_clone_url,
        user_id=user_id,
    )
    created_project = await BaseService.create(
        session, 
        project, 
        conflict_message="Project with this repository already exists"
    )
    return created_project.external_id


async def get(
    session: AsyncSession,
    external_project_id: str,
) -> Project:
    return await BaseService.get_by_external_id(
        session, 
        Project, 
        external_project_id,
        not_found_message="Project not found"
    )


async def get_by_id(
    session: AsyncSession,
    project_id: int,
) -> Project:
    return await BaseService.get_by_id(
        session, 
        Project, 
        project_id,
        not_found_message="Project not found"
    )


async def get_all(
    session: AsyncSession,
    user_id: str,
) -> Sequence[Project]:
    return await BaseService.get_many(
        session, 
        Project, 
        filters={"user_id": user_id},
        order_by="created_at"
    )


async def update_settings(
    session: AsyncSession,
    project: Project,
    rules_file: str,
    setup_script: str,
) -> Project:
    return await BaseService.update(
        session,
        project,
        rules_file_path=rules_file,
        setup_script_path=setup_script
    )