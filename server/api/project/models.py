from pydantic import BaseModel
from api.database.models import Project


class ProjectPublic(BaseModel):
    id: str
    repo_name: str
    repo_html_url: str
    rules_file_path: str
    setup_script_path: str

    @classmethod
    def from_project(cls, project: Project) -> "ProjectPublic":
        return cls(
            id=project.external_id,
            repo_name=project.repo_name,
            repo_html_url=project.repo_html_url,
            rules_file_path=project.rules_file_path,
            setup_script_path=project.setup_script_path
        )