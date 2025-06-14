import { useState, useEffect, useRef, type SetStateAction, type Dispatch } from "react";
import { useApi } from "@/components/api/use-api";
import type { ChatMessage, TextContentBlock } from "@/components/chat/types";
import type { components } from "@/generated/openapi";

type TaskEvent =
  | components["schemas"]["MessageStartEvent"]
  | components["schemas"]["TextDeltaEvent"]
  | components["schemas"]["ToolInputBlock"]
  | components["schemas"]["ToolResultBlock"]
  | components["schemas"]["MessageStopEvent"]
  | components["schemas"]["ErrorEvent"];

interface UseTaskStreamProps {
  taskId: string | undefined;
}

interface UseTaskStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingError: string;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  refetchStream: () => void;
}

export function useTaskStream({ taskId }: UseTaskStreamProps): UseTaskStreamReturn {
  const { $api, $parseSSEStream } = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "default_user_msg", role: "user", content: [{ type: "text", text: "" }] },
    { id: "default_assistant_msg", role: "assistant", content: [{ type: "tool_input", tool_id: "setup_tool_id", tool_name: "setup", tool_input: "Starting container" }] }
  ]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingError, setStreamingError] = useState<string>("");
  const streamRef = useRef<{ cancel: () => void } | null>(null);

  const { data: task } = $api.useQuery("get", "/task/{task_id}", {
    params: { path: { task_id: taskId! } }
  }, {
    refetchInterval: (data) => (data.state.data?.title === "" ? 500 : false),
    enabled: !!taskId,
  });

  const handleTaskEvent = (taskEvent: TaskEvent) => {
    if (taskEvent.type === "tool_input") {
      setMessages(prev => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        const lastMessage = updated[lastMessageIndex];
        if (!lastMessage || lastMessage.role !== "assistant") {
          return [...prev, {
            id: Math.random().toString(),
            role: "assistant",
            content: [taskEvent]
          }];
        };

        const toolCallIndex = lastMessage.content.findIndex(block => block.type === "tool_input" && block.tool_id === taskEvent.tool_id);
        if (toolCallIndex !== -1) {
          updated[lastMessageIndex] = {
            ...lastMessage,
            content: [
              ...lastMessage.content.slice(0, toolCallIndex),
              taskEvent,
              ...lastMessage.content.slice(toolCallIndex + 1)
            ]
          };
        } else {
          updated[lastMessageIndex] = {
            ...lastMessage,
            content: [...lastMessage.content, taskEvent]
          };
        };
        return updated;
      });
    }

    else if (taskEvent.type === "tool_result") {
      setMessages(prev => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        const lastMessage = updated[lastMessageIndex];
        if (!lastMessage || lastMessage.role !== "assistant") return prev;

        updated[lastMessageIndex] = {
          ...lastMessage,
          content: [...lastMessage.content, taskEvent]
        };

        return updated;
      });
    }

    else if (taskEvent.type === "text_delta") {
      setMessages(prev => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        const lastMessage = updated[lastMessageIndex];

        if (!lastMessage || lastMessage.role !== "assistant") {
          return [...prev, {
            id: Math.random().toString(),
            role: "assistant",
            content: [{ type: "text", text: taskEvent.text }]
          }];
        }

        const lastContentBlock = lastMessage.content[lastMessage.content.length - 1];

        if (lastContentBlock?.type === "text") {
          updated[lastMessageIndex] = {
            ...lastMessage,
            content: [
              ...lastMessage.content.slice(0, -1),
              {
                ...lastContentBlock,
                text: lastContentBlock.text + taskEvent.text
              }
            ]
          };
        } else {
          const newTextBlock: TextContentBlock = {
            type: "text",
            text: taskEvent.text
          };
          updated[lastMessageIndex] = {
            ...lastMessage,
            content: [...lastMessage.content, newTextBlock]
          };
        }

        return updated;
      });
    }

    else if (taskEvent.type === "message_stop") {
      setIsStreaming(false);
    }

    else if (taskEvent.type === "error") {
      setStreamingError(taskEvent.error_message);
      setIsStreaming(false);
    }
  }

  const startStream = () => {
    if (!taskId) return;
    if (streamRef.current) {
      streamRef.current.cancel();
    }
    setIsStreaming(true);
    setStreamingError("");

    const stream = $parseSSEStream("post", "/task/{task_id}/events", {
      params: {
        path: { task_id: taskId }
      }
    }, handleTaskEvent);
    streamRef.current = stream;
    return stream;
  };

  const refetchStream = () => {
    startStream();
  };

  useEffect(() => {
    const stream = startStream();
    return () => {
      if (stream) {
        stream.cancel();
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (!task || messages[0]?.content.every(block => block.type === 'text' && block.text === task.description)) return;

    setMessages(prev => {
      return [
        { ...prev[0], content: [{ type: "text", text: task.description }] },
        ...prev.slice(1)
      ]
    });
  }, [task, messages]);

  return {
    messages,
    isStreaming,
    streamingError,
    setMessages,
    refetchStream,
  };
} 