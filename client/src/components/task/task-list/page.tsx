import { useParams } from "react-router";
import { useApi } from "../../api/use-api";
import ProjectHeader from "../../header/project-header";
import TaskTable from "./task-table";

export default function TaskListPage() {
  const { project_id = "" } = useParams<{ project_id: string }>();
  const { $api } = useApi();
  const { data: projects } = $api.useQuery("get", "/project");
  const project = projects?.find((project) => project.id === project_id);
  const { data: tasks, isLoading } = $api.useQuery(
    "get", 
    "/project/{project_id}/tasks", 
    { params: { path: { project_id } } }
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <ProjectHeader 
        project={project}
        projectTab="task-list"
      />
      <div className="flex max-w-4xl mx-auto flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
        <div className="max-w-4xl mx-auto">
          <TaskTable projectId={project_id} tasks={tasks} loading={isLoading} />
        </div>
      </div>
    </div>
  );
} 