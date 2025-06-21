import nanoid
from api.database.models import Project, Task
from .settings import REPO_PATH
from api.agent_tools.executor import SandboxExecutor
from api.agent_tools.loop import run_agent_loop
from api.agent_tools.tools import AgentToolbox
from anthropic.types import MessageParam
from api.database.dependencies import async_session
import api.task.queue_service as queue_service
from api.agent_tools.models import ToolInputSetup, ToolResultBlock
import api.task.service as task_service
from typing import Callable, Awaitable, Any, Literal
from functools import wraps
from sqlmodel.ext.asyncio.session import AsyncSession
from e2b_code_interpreter import CommandExitException, NotFoundException

SETUP_TOOL_ID = "setup_tool_id"


def with_sandbox(sandbox_id_attr: Literal["sandbox_id"] | None = None) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            task = args[0] if args else None
            if not isinstance(task, Task):
                raise ValueError("First argument must be a Task instance")
            sandbox_id = getattr(task, sandbox_id_attr) if sandbox_id_attr else None
            
            async with async_session() as session:
                async with SandboxExecutor(task.id, session, sandbox_id) as executor:
                    try:
                        return await func(*args, executor, session, **kwargs)
                    except Exception as e:
                        print(f"Error running agent flow: {e}")
                    finally:
                        await task_service.update_status(session, task.id, "pending_review")
        return wrapper
    return decorator


@with_sandbox()
async def start_task_flow(task: Task, project: Project, gh_access_token: str, skip_agent: bool, executor: SandboxExecutor, session: AsyncSession) -> None:
    git_output = await _run_setup_command(executor, task.id,  "sudo apt-get update && sudo apt-get install -y curl git",  "Installing git")
    await executor.run("&& ".join([
        "git config --global user.name \"Fleet\"",
        "git config --global user.email \"fleet@qual.dev\"",
        "git config --global credential.helper store",
        "git config --global push.autoSetupRemote true",
        f"echo \"https://fleet:{gh_access_token}@github.com\" > ~/.git-credentials"
    ]))
    clone_command = f"git clone {project.repo_clone_url} {REPO_PATH} && cd {REPO_PATH} && git checkout -b fleet-{nanoid.generate(size=8)}"
    clone_output = await _run_setup_command(executor,task.id, clone_command, f"Cloning repository {project.repo_name}")
    try:
        rules_output = await _run_setup_command(executor,task.id, f"cat {REPO_PATH}/{project.rules_file_path}", "Reading rules file")
    except CommandExitException:
        rules_output = "No rules file found"
    setup_output = await _run_setup_command(executor, task.id,  project.setup_script_path,  "Running setup script")

    await queue_service.push(task.id, ToolInputSetup(
        tool_id=SETUP_TOOL_ID,
        tool_name="setup", 
        tool_input="Setup complete"
    )) # type: ignore
    combined_output = "".join([
        f"Installing git:{git_output}",
        f"Cloning repository:{clone_output}",
        f"Reading rules file: {rules_output}",
        f"Running setup script:{setup_output}",
    ])
    await queue_service.push(task.id, ToolResultBlock(
        tool_id=SETUP_TOOL_ID,
        tool_result=combined_output,
    ))

    if not skip_agent:
        toolbox = AgentToolbox(executor)
        starting_messages: list[MessageParam] = [{ "role": "user", "content": task.description }]
        await run_agent_loop(task.id, toolbox, messages=starting_messages, user_rules_file_content=rules_output)


@with_sandbox("sandbox_id")
async def run_agent_flow(
    task: Task, 
    starting_messages: list[MessageParam], 
    rules_file_path: str, 
    executor: SandboxExecutor, 
    session: AsyncSession
) -> None:
    await task_service.update_status(session, task.id, "running")
    toolbox = AgentToolbox(executor)
    try:
        rules_output = await executor.sbx.files.read(REPO_PATH + "/" + rules_file_path)
    except NotFoundException:
        rules_output = "No rules file found"
    await run_agent_loop(task.id, toolbox, messages=starting_messages, user_rules_file_content=rules_output)


async def _run_setup_command(
    executor: SandboxExecutor, 
    task_id: int, 
    command: str, 
    title: str,
    raise_on_error: bool = False
) -> str:
    tool_input = ToolInputSetup(
        tool_id=SETUP_TOOL_ID,
        tool_name="setup", 
        tool_input=title
    )
    await queue_service.push(task_id, tool_input) # type: ignore
    return await executor.run(command, raise_on_error)