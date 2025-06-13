import { useApi } from "@/components/api/use-api";
import ProjectHeader from "@/components/header/project-header";
import { GithubIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "../ui/button";

export default function HomePage() {
  const { $api } = useApi()
  const { data: projects, isLoading } = $api.useQuery("get", "/project")
  const navigate = useNavigate()

  if (projects?.length === 0) {
    navigate("/project/new")
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <ProjectHeader
        actions={
          <Link to="/project/new">
            <Button>
              New
            </Button>
          </Link>
        }      
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-4">
        {projects && projects.map((project) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="border-gray-600 border flex flex-row justify-between items-center px-4 py-6 rounded-lg gap-4 cursor-pointer hover:bg-gray-800"
          >
            <h1 className="truncate font-bold text-lg">{project.repo_name}</h1>
            <div
              className="group"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(project.repo_html_url, "_blank")
              }}
            >
              <GithubIcon className="w-6 h-6 group-hover:bg-gray-600 p-1 rounded" />
            </div>
          </Link>
        ))}
        {isLoading && <p>Loading...</p>}
      </div>
    </div>
  )
}