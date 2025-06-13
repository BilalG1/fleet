from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class GlobalConfig(BaseSettings):
    environment: Literal["local", "production"] = "production"
    
    model_config = SettingsConfigDict(
        env_file="../.env", 
        extra="ignore", 
        env_prefix="API_",
        
    )

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

config = GlobalConfig()