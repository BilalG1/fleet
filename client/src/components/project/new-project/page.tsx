import { useState } from "react";
import GithubRepoSelecter from "./github-repo-selecter";
import { Button } from "@/components/ui/button";
import { useApi } from "@/components/api/use-api";
import { useGhToken } from "@/components/auth/use-gh-token";
import ProjectSettings from "../project-settings";
import { useNavigate } from "react-router";

export default function NewProject() {
  const navigate = useNavigate();
  const { $api } = useApi();
  const { ghToken } = useGhToken();

  const [stage, setStage] = useState<"select-repo" | "settings">("select-repo");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

  const { mutate, isPending } = $api.useMutation("post", "/project", {
    onSuccess: (projectId) => {
      setProjectId(projectId);
      setStage("settings");
    }
  });

  const handleCreateProject = () => {
    if (!selectedRepoId || !ghToken) return;
    mutate({
      params: {
        query: {
          repo_id: selectedRepoId,
          gh_token: ghToken
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 justify-center items-center pt-10">

      <div className="flex flex-col gap-8 max-w-2xl w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-sm text-muted-foreground">{
            stage === "select-repo" ?
              "Select a repository to get started." :
              "Configure settings. You can change these later."
          }
          </p>
        </div>
        {stage === "select-repo" ? (
          <>
            <GithubRepoSelecter selectedRepoId={selectedRepoId} onSelectRepo={setSelectedRepoId} />
            <div className="text-end">
              <Button
                loading={isPending}
                disabled={!selectedRepoId || !ghToken}
                onClick={handleCreateProject}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <ProjectSettings 
            projectId={projectId!} 
            onSuccess={() => navigate(`/project/${projectId}`)} 
          />
        )}
      </div>
    </div>
  )
}