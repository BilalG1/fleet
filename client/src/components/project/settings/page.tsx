import { useParams } from "react-router";
import { toast } from "sonner";
import ProjectHeader from "@/components/header/project-header";
import { useApi } from "@/components/api/use-api";
import ProjectSettings from "@/components/project/project-settings";

export default function ProjectSettingsPage() {
  const { project_id } = useParams<{ project_id: string }>();
  const { $api } = useApi();
  const { data: projects } = $api.useQuery("get", "/project");
  const project = projects?.find((project) => project.id === project_id);

  return (
    <div className="min-h-dvh flex flex-col">
      <ProjectHeader project={project} projectTab="settings" />
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto pt-10 p-4">
        <div className="text-2xl text-primary font-bold w-full text-center pb-4">Project Settings</div>
        <ProjectSettings 
          projectId={project_id!} 
          onSuccess={() => toast.success("Settings saved")} 
        />
      </div>
    </div>
  );
}