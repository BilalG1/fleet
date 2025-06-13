from api.settings import GlobalConfig


class Config(GlobalConfig):
    database_url: str

    @property
    def connection_string(self) -> str:
        return f"postgresql+asyncpg://{self.database_url}"

config = Config()