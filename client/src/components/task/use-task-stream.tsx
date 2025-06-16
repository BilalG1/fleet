import { useState, useEffect, useRef } from "react";
import { useApi } from "@/components/api/use-api";
import { useChatMessages } from "@/components/chat";
import type { components } from "@/generated/openapi";
import { updateLastMessageOrCreateText, updateLastMessageOrCreateWithContent } from "@/components/chat/message-utils";

type TaskEvent =
  | components["schemas"]["MessageStartEvent"]
  | components["schemas"]["TextDeltaEvent"]
  | components["schemas"]["ToolInputBlock-Input"]
  | components["schemas"]["ToolResultBlock"]
  | components["schemas"]["MessageStopEvent"]
  | components["schemas"]["ErrorEvent"];

interface UseTaskStreamProps {
  taskId: string | undefined;
}

interface UseTaskStreamReturn {
  isStreaming: boolean;
  streamingError: string;
  refetchStream: () => void;
}

export function useTaskStream({ taskId }: UseTaskStreamProps): UseTaskStreamReturn {
  const { $api, $parseSSEStream } = useApi();
  const { messages, setMessages } = useChatMessages(taskId || "");
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
      updateLastMessageOrCreateWithContent(
        setMessages,
        "assistant",
        taskEvent,
        "replace",
        (block) => block.type === "tool_input" && block.tool_id === taskEvent.tool_id
      );
    }

    else if (taskEvent.type === "tool_result") {
      updateLastMessageOrCreateWithContent(
        setMessages,
        "assistant",
        taskEvent,
        "add"
      );
    }

    else if (taskEvent.type === "text_delta") {
      updateLastMessageOrCreateText(setMessages, "assistant", taskEvent.text);
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
    isStreaming,
    streamingError,
    refetchStream,
  };
} 