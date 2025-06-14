import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { useApi } from "../api/use-api";
import ProjectHeader from "../header/project-header";
import { Button } from "../ui/button";
import { List, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useGhToken } from "@/components/auth/use-gh-token";
import { ChatInput } from "../chat/chat-input";
import { cn } from "@/lib/utils";
import { useScreenSize } from "@/components/general/use-screen-size";

export default function ProjectPage() {
  const { project_id = "" } = useParams<{ project_id: string }>();
  const { isMobile } = useScreenSize();
  const { ghToken } = useGhToken();
  const navigate = useNavigate();
  const { $api } = useApi();
  const { data: projects } = $api.useQuery("get", "/project");
  const project = projects?.find((project) => project.id === project_id);
  const [sentMessage, setSentMessage] = useState(false);

  const createTaskMutation = $api.useMutation("post", "/task", {
    onSuccess: (taskId) => {
      navigate(`/project/${project_id}/task/${taskId}`);
    },
  });

  const handleCreateTask = (message: string) => {
    if (message && ghToken) {
      setSentMessage(true);
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
            <div className={cn("flex gap-2 transition-opacity duration-500", sentMessage && "opacity-0")}>
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
        <div
          className={cn(
            "flex flex-col grow gap-4 w-full max-w-3xl mt-[25dvh] p-2",
            sentMessage || isMobile ? "justify-between" : "justify-start",
            isMobile && "p-4"
          )}
        >
          <div
            className={cn(
              "text-3xl text-primary font-bold w-full text-center transition-opacity duration-300",
              sentMessage && "opacity-0"
            )}
          >
            Get started
          </div>
          <motion.div layout transition={{ duration: 0.3, ease: "easeOut" }}>
            <ChatInput
              onSendMessage={handleCreateTask}
              onStartVoiceMode={handleStartVoiceMode}
              loading={createTaskMutation.isPending}
              disabled={createTaskMutation.isPending}
              defaultHeight={sentMessage || isMobile ? 40 : 128}
              placeholder="Describe a task"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
