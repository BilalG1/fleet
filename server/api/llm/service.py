import anthropic
from typing import AsyncGenerator
from anthropic.types import MessageParam
from anthropic.lib.streaming._types import MessageStreamEvent
from .settings import config


async def generate_title(description: str) -> str:
    client = anthropic.AsyncAnthropic(
        api_key=config.anthropic_api_key
    )
    
    prompt = f"""You are a helpful assistant that generates concise, clear titles for tasks based on their descriptions.

Generate a short, descriptive title (2-4 words) that captures the essence of this task. The title should be:
- Clear and specific
- Without quotes or special formatting

Just return the title, nothing else.

<task-description>
{description}
</task-description>"""

    try:
        message = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[
                { "role": "user", "content": prompt }
            ]
        )
        
        if (
            message.content and 
            len(message.content) > 0 and 
            message.content[0].type == "text"
        ):
            title = str(message.content[0].text).strip()
            return title
        else:
            return "New Task"
        
    except Exception:
        return "New Task" 
    

async def stream_events(messages: list[MessageParam]) -> AsyncGenerator[MessageStreamEvent, None]:
    client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
    async with client.messages.stream(
        max_tokens=1024,
        model="claude-opus-4-20250514",
        messages=messages,
    ) as stream:
        async for event in stream:
            yield event
    