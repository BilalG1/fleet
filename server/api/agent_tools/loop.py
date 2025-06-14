from typing import Sequence
from anthropic import AsyncAnthropic
from anthropic.types import MessageParam, ToolResultBlockParam
import api.task.queue_service as queue_service
import api.task.service as task_service
from api.llm.settings import config as llm_config
from api.database.dependencies import async_session
from .tools import AgentToolbox
from .models import ToolInputBlock, ToolResultBlock
from api.task.models import TextBlock, ContentBlock as ContentBlockModel
from api.task.settings import REPO_PATH


async def run_agent_loop(
    task_id: int,
    toolbox: AgentToolbox, 
    messages: list[MessageParam],
    user_rules_file_content: str,
    max_iterations: int = 20
) -> None:
    client = AsyncAnthropic(api_key=llm_config.anthropic_api_key)
    current_messages = messages.copy()
    message_order = len(messages)

    for iteration in range(max_iterations):
        async with client.messages.stream(
            model="claude-4-sonnet-20250514",
            max_tokens=10_000,
            system=get_system_prompt(user_rules_file_content),
            messages=current_messages,
            tools=toolbox.to_params(),
        ) as stream:
            async for chunk in stream:
                await queue_service.push_message_stream_event(task_id, chunk)

        final_message = await stream.get_final_message()
        current_messages.append({
            "role": final_message.role,
            "content": final_message.content
        })
        
        content_blocks: list[ContentBlockModel] = []
        for content_block in final_message.content:
            if content_block.type == "text":
                if content_block.text.strip():
                    content_blocks.append(TextBlock(text=content_block.text))
            elif content_block.type == "tool_use":
                tool_input_block = ToolInputBlock.from_tool_call(content_block)
                content_blocks.append(tool_input_block)
                await queue_service.push(task_id, tool_input_block)
        
        # Save assistant message to database
        if content_blocks:
            async with async_session() as session:
                message = await task_service.create_message(
                    session, task_id, "assistant", message_order
                )
                await task_service.save_content_blocks(session, message.id, content_blocks)
        
        message_order += 1
        tool_calls = [block for block in content_blocks if block.type == "tool_input"]
        if not tool_calls:
            break
        
        tool_results: list[ToolResultBlockParam] = []
        tool_result_blocks: list[ToolResultBlock] = []
        
        for tool_call in tool_calls:
            try:
                tool_result = await toolbox.execute_tool(tool_call)
            except Exception as e:
                print("ERROR EXECUTING TOOL: ", e)
                tool_result = ToolResultBlockParam(
                    type="tool_result",
                    tool_use_id=tool_call.tool_id,
                    content=f"Error: {str(e)}",
                    is_error=True,
                )
            finally:
                tool_results.append(tool_result)
                tool_result_blocks.append(ToolResultBlock.from_tool_result(tool_result))
                await queue_service.push(task_id, ToolResultBlock.from_tool_result(tool_result))
        
        if tool_result_blocks:
            async with async_session() as session:
                message = await task_service.create_message(
                    session, task_id, "user", message_order
                )
                await task_service.save_content_blocks(session, message.id, tool_result_blocks)
        
        message_order += 1
        current_messages.append({ "role": "user", "content": tool_results })


def get_system_prompt(user_rules_file_content: str) -> str:
    return f"""
You are a helpful programmer. Your job is to help the user with their task by using the tools provided to you.
You are working in a lightweight sandbox environment, so feel free to run any commands you need to without asking.
The sandbox is a Debian based Linux environment with git installed. The user's repository is cloned in the sandbox and is available at {REPO_PATH}.
Your starting working directory is {REPO_PATH}. You are in a new git branch.
The user cannot see tool results by default, so make sure to include any necessary information in your response. For example, provide a link to create a new github pr after pushing a branch.

<tools>
Always try to make multiple tool calls at once to avoid round trips to the sandbox server.
All commands timeout after 10 seconds.
For the bash tool always pass in an extra parameter "description" which is a short 2-4 word summary of what the command does that is shown to the user.
</tools>

<user_rules>
{user_rules_file_content}
</user_rules>
""" 