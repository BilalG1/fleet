from typing import Sequence
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from api.database.models import Project


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
    session.add(project)
    await session.commit()
    return project.external_id


async def get(
    session: AsyncSession,
    external_project_id: str,
) -> Project:
    query = select(Project).where(Project.external_id == external_project_id)
    return (await session.exec(query)).one()


async def get_by_id(
    session: AsyncSession,
    project_id: int,
) -> Project:
    query = select(Project).where(Project.id == project_id)
    return (await session.exec(query)).one()


async def get_all(
    session: AsyncSession,
    user_id: str,
) -> Sequence[Project]:
    query = select(Project).where(Project.user_id == user_id)
    return (await session.exec(query)).all()


async def update_settings(
    session: AsyncSession,
    project: Project,
    rules_file: str,
    setup_script: str,
) -> None:
    project.rules_file_path = rules_file
    project.setup_script_path = setup_script
    await session.commit()