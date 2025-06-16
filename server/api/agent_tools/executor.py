import asyncio
from typing import Any
import nanoid
from e2b_code_interpreter import AsyncSandbox, CommandExitException, AsyncCommandHandle, NotFoundException
import api.task.service as task_service
from sqlmodel.ext.asyncio.session import AsyncSession
from api.task.settings import config, REPO_PATH



class SandboxExecutor:
    sbx: AsyncSandbox
    command: AsyncCommandHandle
    
    def __init__(self, task_id: int, session: AsyncSession, reconnect_sandbox_id: str | None = None):
        self.task_id = task_id
        self.session = session
        self.output_buffer: list[str] = []
        self.command_complete_event = asyncio.Event()
        self.current_marker: str | None = None
        self.reconnect_sandbox_id: str | None = reconnect_sandbox_id

    async def __aenter__(self) -> "SandboxExecutor":
        if self.reconnect_sandbox_id:
            self.sbx = await AsyncSandbox.resume(api_key=config.e2b_api_key, sandbox_id=self.reconnect_sandbox_id, timeout=3_600)
            processes = await self.sbx.commands.list()
            last_command_process = next((p for p in processes if p.cmd == "/bin/bash" and p.args and p.args[-1] == "/bin/bash"), None)
            if not last_command_process:
                print("NO COMMAND FOUND IN RECONNECT, RESTARTING")
                await self.restart_bash()
            else:
                self.command = await self.sbx.commands.connect(
                    last_command_process.pid,
                    on_stdout=self._on_stdout,
                    on_stderr=self._on_stderr,
                )
            await task_service.update_sandbox_usage(self.session, self.task_id, "running")
            return self
        
        self.sbx = await AsyncSandbox.create(api_key=config.e2b_api_key, timeout=3_600)
        await task_service.update_sandbox_id(self.session, self.task_id, self.sbx.sandbox_id)
        await self.restart_bash()
        await task_service.update_sandbox_usage(self.session, self.task_id, "running")
        return self

    async def __aexit__(self, *args: Any) -> None:
        pass

    def _on_stdout(self, output: str) -> None:
        if self.current_marker:
            self.output_buffer.append(output)
            if self.current_marker in output:
                self.command_complete_event.set()
    
    def _on_stderr(self, output: str) -> None:
        if self.current_marker:
            self.output_buffer.append(output)

    async def run(self, command: str, raise_on_error: bool = False) -> str:
        if not self.sbx or not self.command:
            raise RuntimeError("SandboxExecutor must be used as an async context manager")
        await task_service.update_sandbox_usage(self.session, self.task_id, "running")
        
        try:
            self.current_marker = f"COMMAND_COMPLETE_{nanoid.generate()}"
            self.output_buffer = []
            self.command_complete_event.clear()
            if self.command.exit_code is not None:
                print("COMMAND EXITED, RESTARTING")
                await self.restart_bash()

            command_with_marker = f"{command}; echo '{self.current_marker}'\n"
            try:
                await self.sbx.commands.send_stdin(self.command.pid, command_with_marker, request_timeout=5)
            except NotFoundException:
                print("COMMAND NOT FOUND, RESTARTING")
                await self.restart_bash()
                await self.sbx.commands.send_stdin(self.command.pid, command_with_marker, request_timeout=5)
            try:
                await asyncio.wait_for(self.command_complete_event.wait(), timeout=10)
            except asyncio.TimeoutError:
                output = "Error: Command timed out after 10 seconds"
            else:
                raw_output = "".join(self.output_buffer)
                output = raw_output.replace(self.current_marker, "").strip()
            
            # Format terminal output for display
            terminal_text = f"\n```bash\n$ {command}\n{output}\n```\n"
            return terminal_text
            
        except CommandExitException as e:
            if raise_on_error:
                raise e
            terminal_text = f"\n```bash\n$ {command}\nError: {str(e)}\n```\n"
            return terminal_text
        except Exception as e:
            print("SANDBOX EXECUTOR ERROR: ", e)
            print(type(e))
            raise e

    async def restart_bash(self) -> None:
        if not self.sbx:
            raise RuntimeError("SandboxExecutor must be used as an async context manager")
            
        result = await self.sbx.commands.run(
            "/bin/bash", 
            background=True, 
            on_stdout=self._on_stdout, 
            on_stderr=self._on_stderr,
            # cwd=REPO_PATH # errors for some reason
        )
        self.command = result
        self.output_buffer = []
        self.command_complete_event.clear()