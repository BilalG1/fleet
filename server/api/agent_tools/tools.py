from .executor import SandboxExecutor
from anthropic.types import (
    ToolUnionParam, 
    ToolBash20250124Param, 
    ToolResultBlockParam,
)
from anthropic.types.beta import BetaToolTextEditor20250429Param
from .models import ToolInputBlock, TextEditorInput, BashToolInput



class AgentToolbox:
    def __init__(self, executor: SandboxExecutor):
        self.executor = executor

    def to_params(self) -> list[ToolUnionParam]:
        return [
            ToolBash20250124Param(name="bash", type="bash_20250124"),
            BetaToolTextEditor20250429Param(name="str_replace_based_edit_tool", type="text_editor_20250429") # type: ignore
        ]

    async def execute_tool(self, tool_call: ToolInputBlock) -> ToolResultBlockParam:
        if tool_call.root.tool_name == "bash":
            if tool_call.root.tool_input.restart:
                await self.executor.restart_bash()
                return ToolResultBlockParam(
                    type="tool_result",
                    tool_use_id=tool_call.root.tool_id,
                    content="Bash restarted"
                )
            output = await self.executor.run(tool_call.root.tool_input.command or "")
            return ToolResultBlockParam(
                type="tool_result",
                tool_use_id=tool_call.root.tool_id,
                content=output
            )
        elif tool_call.root.tool_name == "str_replace_based_edit_tool":
            result = await self._handle_text_editor_tool(tool_call.root.tool_input, tool_call.root.tool_id)
            return ToolResultBlockParam(
                type="tool_result",
                tool_use_id=tool_call.root.tool_id,
                content=result
            )
        raise ValueError(f"Unknown tool: {tool_call.root.tool_name}")
    
    async def _handle_text_editor_tool(self, tool_input: TextEditorInput, group_id: str) -> str:
        if tool_input.command not in ["view", "str_replace", "create", "insert"]:
            raise ValueError(f"Unknown command: {tool_input.command}")
        
        if tool_input.command == "view":
            path = tool_input.path
            view_range = tool_input.view_range
            if path.endswith('/') or '.' not in path.split('/')[-1]:
                result = await self.executor.sbx.files.list(path)
                return "\n".join([file.name for file in result])
            else:
                file_content = await self.executor.sbx.files.read(tool_input.path)
                if not view_range:
                    return file_content # type: ignore
                if len(view_range) == 2:
                    lines = file_content.split('\n')
                    start_line = max(0, view_range[0] - 1)
                    end_line = len(lines) if view_range[1] == -1 else view_range[1] - 1
                    selected_lines = lines[start_line:end_line]
                    return '\n'.join(selected_lines)
                raise ValueError("Invalid view_range, must be a list of two integers")
                
        elif tool_input.command == "str_replace":
            file_content = await self.executor.sbx.files.read(tool_input.path)
            occurrences = file_content.count(tool_input.old_str)
            if occurrences == 0:
                return f"Text to replace not found in {tool_input.path}"
            elif occurrences > 1:
                return f"Found {occurrences} matches for replacement text. Please provide more context to make a unique match."
            new_content = file_content.replace(tool_input.old_str, tool_input.new_str)
            await self.executor.sbx.files.write(tool_input.path, new_content)
            return f"Successfully replaced text in {tool_input.path}"
                
        elif tool_input.command == "create":
            await self.executor.sbx.files.write(tool_input.path, tool_input.file_text)
            return f"Successfully created file {tool_input.path}"
                
        elif tool_input.command == "insert":
            file_content = await self.executor.sbx.files.read(tool_input.path)
            lines = file_content.split('\n')
            lines.insert(tool_input.insert_line, tool_input.insert_text)
            new_content = '\n'.join(lines)
            await self.executor.sbx.files.write(tool_input.path, new_content)
            return f"Successfully inserted text at line {tool_input.insert_line} in {tool_input.path}"
        return "" 