import asyncio
from typing import Any
from e2b_code_interpreter import AsyncSandbox
from api.database.dependencies import async_session
import api.task.service as task_service
from api.task.settings import config


class SandboxCleanupService:
    def __init__(self, idle_minutes: int = 5, check_interval_minutes: int = 2):
        self.idle_minutes = idle_minutes
        self.check_interval_seconds = check_interval_minutes * 60
        self.running = False
        self.task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        """Start the background cleanup service"""
        if self.running:
            return
        
        self.running = True
        self.task = asyncio.create_task(self._cleanup_loop())
        print(f"Started sandbox cleanup service (idle_minutes={self.idle_minutes}, check_interval={self.check_interval_seconds}s)")

    async def stop(self) -> None:
        """Stop the background cleanup service"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        print("Stopped sandbox cleanup service")

    async def _cleanup_loop(self) -> None:
        """Main cleanup loop that runs in the background"""
        while self.running:
            try:
                await self._cleanup_idle_sandboxes()
            except Exception as e:
                print(f"Error in sandbox cleanup: {e}")
            
            # Wait for next check interval
            await asyncio.sleep(self.check_interval_seconds)

    async def _cleanup_idle_sandboxes(self) -> None:
        """Find and pause idle sandboxes"""
        async with async_session() as session:
            try:
                idle_tasks = await task_service.get_idle_sandboxes(session, self.idle_minutes)
                
                if not idle_tasks:
                    return
                
                for task in idle_tasks:
                    try:
                        await self._pause_sandbox(task.sandbox_id)  # type: ignore
                        await task_service.update_sandbox_usage(session, task.id, "paused")
                    except Exception as e:
                        print(f"Failed to pause sandbox {task.sandbox_id}: {e}")
                        
            except Exception as e:
                print(f"Error getting idle sandboxes: {e}")

    async def _pause_sandbox(self, sandbox_id: str) -> None:
        try:
            sbx = await AsyncSandbox.resume(api_key=config.e2b_api_key, sandbox_id=sandbox_id, timeout=60)
            await sbx.pause()
        except Exception as e:
            print(f"Failed to pause sandbox {sandbox_id}: {e}")
            raise


# Global instance
cleanup_service = SandboxCleanupService()


async def start_cleanup_service() -> None:
    """Start the global cleanup service"""
    await cleanup_service.start()


async def stop_cleanup_service() -> None:
    """Stop the global cleanup service"""
    await cleanup_service.stop() 