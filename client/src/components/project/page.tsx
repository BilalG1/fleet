import { useParams, useNavigate, Link } from "react-router";
import { useApi } from "../api/use-api";
import ProjectHeader from "../header/project-header";
import { Button } from "../ui/button";
import { List, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useGhToken } from "@/components/auth/use-gh-token";
import { ChatInput } from "../chat/chat-input";

export default function ProjectPage() {
  const { project_id = "" } = useParams<{ project_id: string }>();
  const { ghToken } = useGhToken();
  const navigate = useNavigate();
  const { $api } = useApi();
  const { data: projects } = $api.useQuery("get", "/project");
  const project = projects?.find((project) => project.id === project_id);

  const createTaskMutation = $api.useMutation("post", "/task", {
    onSuccess: (taskId) => {
      navigate(`/project/${project_id}/task/${taskId}`);
    }
  });

  const handleCreateTask = (message: string) => {
    if (message && ghToken) {
      createTaskMutation.mutate({
        body: { description: message, project_id: project_id, gh_access_token: ghToken }
      });
    }
  };

  const handleStartVoiceMode = () => {
    console.log("start voice mode");
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <ProjectHeader 
        project={project}
        actions={
          <TooltipProvider>
            <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/project/${project_id}/task-list`}>
                  <Button size="icon"><List /></Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Tasks</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/project/${project_id}/settings`}>
                  <Button size="icon"><Settings /></Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        }
      />
      <div className="flex flex-col grow justify-start items-center">
        <div className="flex flex-col grow md:grow-0 gap-4 w-full max-w-2xl justify-between mt-[25dvh] p-4">
          <div className="text-3xl text-primary font-bold w-full text-center">Get started</div>
          <ChatInput
            onSendMessage={handleCreateTask}
            onStartVoiceMode={handleStartVoiceMode}
            loading={createTaskMutation.isPending}
            disabled={createTaskMutation.isPending}
            placeholder="Describe a task"
          />
        </div>
      </div>
    </div>
  );
}
