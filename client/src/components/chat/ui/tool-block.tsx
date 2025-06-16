import { useState } from "react";
import { cn } from "@/lib/utils";
import ShinyText from "@/components/general/shiny-text";
import type { ContentBlock } from "./types";
import { ChevronRight, CheckCircle, XCircle, Pencil, Eye, FilePlus, TerminalSquare, Power } from "lucide-react";
import { MarkdownContent } from "./markdown-content";

type ToolBlockProps = {
  toolInput: Extract<ContentBlock, { type: "tool_input" }>;
  toolResult?: Extract<ContentBlock, { type: "tool_result" }>;
  isRunning?: boolean;
};

export default function ToolBlock({ toolInput, toolResult, isRunning = false }: ToolBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const title = toolBlockToTitle(toolInput);
  const Icon = toolBlockToIcon(toolInput, toolResult);

  return (
    <div className="px-5 pb-2">
      <div
        onClick={() => setIsExpanded(a => !a)}
        className="group cursor-pointer flex items-center gap-2 text-gray-400 hover:text-gray-300"
      >
        <Icon className={cn("text-gray-400 group-hover:hidden w-5 h-5", isExpanded && "hidden")} />
        <ChevronRight className={cn("text-gray-400 hidden group-hover:block transition-transform w-5 h-5", isExpanded && 'rotate-90', isExpanded && "block")} />
        {isRunning ? (
          <ShinyText text={title} speed={1.5} />
        ) : (
          <span>{title}</span>
        )}
        
      </div>
      {isExpanded && toolResult && (
        <div className={cn(
          "mt-2 border-l-4 text-gray-300 pl-2 ml-2",
          toolResult.is_error ? 'border-red-500' : 'border-gray-500'
        )}>
          {toolInput.tool_name === "bash" || toolInput.tool_name === "setup" ? (
            <MarkdownContent content={toolResult.tool_result} />
          ) : (
            <pre className="text-sm">{toolResult.tool_result}</pre>
          )}
        </div>
      )}
    </div>
  );
}

const toolBlockToTitle = (toolInput: Extract<ContentBlock, { type: "tool_input" }>) => {
  if (toolInput.tool_name === 'bash') {
    return toolInput.tool_input.description || "Running command";
  } else if (toolInput.tool_name === 'str_replace_based_edit_tool') {
    if (toolInput.tool_input.command === 'view') {
      return `Reading ${toolInput.tool_input.path}`;
    } else if (toolInput.tool_input.command === 'str_replace') {
      return `Editing ${toolInput.tool_input.path}`;
    } else if (toolInput.tool_input.command === 'create') {
      return `Creating ${toolInput.tool_input.path}`;
    } else if (toolInput.tool_input.command === 'insert') {
      return `Inserting text into ${toolInput.tool_input.path}`;
    }
  } else if (toolInput.tool_name === 'setup') {
    return toolInput.tool_input
  }
  return 'Unknown tool';
}

const toolBlockToIcon = (toolInput: Extract<ContentBlock, { type: "tool_input" }>, toolResult?: Extract<ContentBlock, { type: "tool_result" }>) => {
  if (toolResult?.is_error) {
    return XCircle;
  }
  if (toolInput.tool_name === 'bash') {
    return TerminalSquare;
  }
  if (toolInput.tool_name === 'str_replace_based_edit_tool') {
    if (toolInput.tool_input.command === 'view') {
      return Eye;
    } else if (toolInput.tool_input.command === 'str_replace') {
      return Pencil;
    } else if (toolInput.tool_input.command === 'create') {
      return FilePlus;
    } else if (toolInput.tool_input.command === 'insert') {
      return Pencil;
    }
  }
  if (toolInput.tool_name === 'setup') {
    return Power;
  }
  return CheckCircle;
}