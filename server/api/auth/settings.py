from api.settings import GlobalConfig


class Config(GlobalConfig):
    stack_project_id: str

config = Config()