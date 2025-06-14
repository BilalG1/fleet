import { useParams } from "react-router";
import ProjectHeader from "@/components/header/project-header";
import { useApi } from "@/components/api/use-api";
import { ChatContainer } from "@/components/chat/chat-container";
import { useTaskStream } from "./use-task-stream";
import { useEffect } from "react";

export default function TaskPage() {
  const { project_id = "", task_id = "" } = useParams<{
    project_id: string;
    task_id: string;
  }>();

  const { $api } = useApi();
  const { data: projects } = $api.useQuery("get", "/project");
  const { data: task } = $api.useQuery(
    "get", 
    "/task/{task_id}", 
    { params: { path: { task_id } } }, 
    { refetchInterval: (data) => (data.state.data?.title === "" ? 500 : false)}
  );
  const { data: dbMessages, isLoading: isLoadingDbMessages } = $api.useQuery(
    "get", 
    "/task/{task_id}/messages", 
    { params: { path: { task_id } } }, 
    { staleTime: Infinity }
  );
  const project = projects?.find((project) => project.id === project_id);

  const { messages, setMessages, refetchStream, isStreaming } = useTaskStream({ taskId: task_id });
  const { mutate: sendMessage } = $api.useMutation(
    "post", 
    "/task/{task_id}/messages", 
    { onSuccess: refetchStream }
  );

  useEffect(() => {
    if (!dbMessages?.length || dbMessages.length === 1) return;
    setMessages(dbMessages);
  }, [dbMessages]);


  const handleSendMessage = (message: string) => {
    setMessages(prev => [
      ...prev, 
      { 
        role: "user", 
        id: Math.random().toString(), 
        content: [{ type: "text", text: message }] 
      }
    ]);
    sendMessage({ 
      body: { text: message }, 
      params: { path: { task_id } } 
    })
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <ProjectHeader project={project} task={task} projectTab="task-list" />
      <ChatContainer 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        loadingMessages={isLoadingDbMessages}
        isStreaming={isStreaming}
      />
    </div>
  );
} 