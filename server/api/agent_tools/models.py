import uuid
from pydantic import BaseModel, Field, RootModel
from typing import Literal, Union, Annotated
from anthropic.types import ToolUseBlock, ToolResultBlockParam


class ViewCommand(BaseModel):
    command: Literal["view"]
    path: str
    view_range: list[int] | None = None


class StrReplaceCommand(BaseModel):
    command: Literal["str_replace"]
    path: str
    old_str: str
    new_str: str


class CreateCommand(BaseModel):
    command: Literal["create"]
    path: str
    file_text: str


class InsertCommand(BaseModel):
    command: Literal["insert"]
    path: str
    insert_line: int
    insert_text: str


TextEditorInput = Annotated[
    Union[ViewCommand, StrReplaceCommand, CreateCommand, InsertCommand], 
    Field(discriminator="command")
]


class BashToolInput(BaseModel):
    command: str | None = None
    restart: bool = False
    description: str | None = None


class ToolInputSetup(BaseModel):
    type: Literal["tool_input"] = "tool_input"
    tool_id: str
    tool_name: Literal["setup"] = "setup"
    tool_input: str


class ToolInputBash(BaseModel):
    type: Literal["tool_input"] = "tool_input"
    tool_id: str
    tool_name: Literal["bash"] = "bash"
    tool_input: BashToolInput


class ToolInputTextEditor(BaseModel):
    type: Literal["tool_input"] = "tool_input"
    tool_id: str
    tool_name: Literal["str_replace_based_edit_tool"] = "str_replace_based_edit_tool"
    tool_input: TextEditorInput


class ToolInputBlock(RootModel[
    Annotated[
        Union[ToolInputBash, ToolInputTextEditor, ToolInputSetup], 
        Field(discriminator="tool_name")
    ]
]):
    @property
    def type(self) -> Literal["tool_input"]:
        return "tool_input"
    @property
    def tool_id(self) -> str:
        return self.root.tool_id
    @property
    def tool_name(self) -> str:
        return self.root.tool_name
    @property
    def tool_input(self) -> TextEditorInput | BashToolInput | str:
        return self.root.tool_input
    
    @classmethod
    def from_tool_call(cls, tool_call: ToolUseBlock) -> "ToolInputBlock":
        return cls(
            tool_id=tool_call.id,
            tool_name=tool_call.name,
            tool_input=tool_call.input
        ) # type: ignore


class ToolResultBlock(BaseModel):
    type: Literal["tool_result"] = "tool_result"
    tool_id: str
    tool_result: str
    is_error: bool = False

    @classmethod
    def from_tool_result(cls, tool_result: ToolResultBlockParam) -> "ToolResultBlock":
        return cls(
            tool_id=tool_result["tool_use_id"],
            tool_result=tool_result["content"],
            is_error=tool_result.get("is_error", False)
        ) 