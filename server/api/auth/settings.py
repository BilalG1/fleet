from api.settings import GlobalConfig


class Config(GlobalConfig):
    stack_project_id: str
    openai_api_key: str

config = Config()