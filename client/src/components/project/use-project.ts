import { useParams } from "react-router";
import { useApi } from "@/components/api/use-api";

export const useProject = () => {
  const { project_id = "" } = useParams<{ project_id: string }>();
  const { $api } = useApi();
  
  const { data: projects, isLoading: isLoadingProjects } = $api.useQuery("get", "/project");
  const project = projects?.find((p) => p.id === project_id);
  
  const createProjectMutation = $api.useMutation("post", "/project");
  const updateSettingsMutation = $api.useMutation("post", "/project/{project_id}/settings");
  
  const { data: tasks, isLoading: isLoadingTasks } = $api.useQuery(
    "get", 
    "/project/{project_id}/tasks",
    { params: { path: { project_id } } },
    { enabled: !!project_id }
  );

  return {
    project_id,
    project,
    projects,
    tasks,
    isLoading: isLoadingProjects || isLoadingTasks,
    createProject: createProjectMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
};