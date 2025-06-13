from api.settings import GlobalConfig


class LLMConfig(GlobalConfig):
    anthropic_api_key: str
    

config = LLMConfig() 