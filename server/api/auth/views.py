from fastapi import APIRouter
from openai import AsyncOpenAI
from .settings import config

router = APIRouter(prefix="/auth")


@router.get("/openai-session")
async def get_openai_session() -> str:
    client = AsyncOpenAI(api_key=config.openai_api_key)
    session = await client.beta.realtime.sessions.create(
        model="gpt-4o-realtime-preview-2025-06-03",
        voice="echo",
        input_audio_transcription={
            "language": "en",
            "model": "whisper-1",
            "prompt": "Expect words related to technology",
        },
    )
    return session.client_secret.value