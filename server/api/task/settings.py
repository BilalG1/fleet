from api.settings import GlobalConfig

REPO_PATH = "/tmp/repo"


class Config(GlobalConfig):
    e2b_api_key: str


config = Config()