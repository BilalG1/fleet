import { useParams } from "react-router";
import { useApi } from "@/components/api/use-api";
import { useChatMessages } from "@/components/chat";
import { useTaskStream } from "./use-task-stream";
import { useEffect } from "react";

export const useTask = () => {
  const { project_id = "", task_id = "" } = useParams<{ project_id: string; task_id: string }>();
  const { $api } = useApi();
  
  const { data: task, isLoading: isLoadingTask } = $api.useQuery(
    "get", 
    "/task/{task_id}", 
    { params: { path: { task_id } } }, 
    { 
      refetchInterval: (data) => (data.state.data?.title === "" ? 500 : false),
      enabled: !!task_id
    }
  );
  
  const { data: dbMessages, isLoading: isLoadingMessages } = $api.useQuery(
    "get", 
    "/task/{task_id}/messages", 
    { params: { path: { task_id } } }, 
    { 
      staleTime: Infinity,
      enabled: !!task_id
    }
  );

  const { messages, setMessages } = useChatMessages(task_id);
  const { refetchStream, isStreaming } = useTaskStream({ taskId: task_id });
  
  const sendMessageMutation = $api.useMutation(
    "post", 
    "/task/{task_id}/messages", 
    { onSuccess: refetchStream }
  );
  
  const createTaskMutation = $api.useMutation("post", "/task");
  const executeToolCallsMutation = $api.useMutation("post", "/task/{task_id}/tool-calls");

  useEffect(() => {
    if (!dbMessages?.length || dbMessages.length === 1) return;
    setMessages(dbMessages);
  }, [dbMessages, setMessages]);

  const handleSendMessage = (message: string) => {
    if (!task_id) return;
    
    setMessages(prev => [
      ...prev, 
      { 
        role: "user", 
        id: Math.random().toString(), 
        content: [{ type: "text", text: message }] 
      }
    ]);
    
    sendMessageMutation.mutate({
      params: { path: { task_id } },
      body: { text: message }
    });
  };

  return {
    project_id,
    task_id,
    task,
    messages,
    isLoading: isLoadingTask || isLoadingMessages,
    isStreaming,
    handleSendMessage,
    createTask: createTaskMutation.mutate,
    executeToolCalls: executeToolCallsMutation.mutate,
    isCreatingTask: createTaskMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
  };
};