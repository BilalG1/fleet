import { useEffect, useState } from "react"
import { useApi } from "@/components/api/use-api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  projectId: string
  onSuccess: () => void
}

export default function ProjectSettings({ projectId, onSuccess }: Props) {
  const { $api } = useApi()
  const [rulesFile, setRulesFile] = useState("")
  const [setupScript, setSetupScript] = useState("")

  const { mutate, isPending } = $api.useMutation("post", "/project/{project_id}/settings", { onSuccess })
  const { data: projects } = $api.useQuery("get", "/project")
  const project = projects?.find((project) => project.id === projectId)

  useEffect(() => {
    if (!project) return
    setRulesFile(project.rules_file_path)
    setSetupScript(project.setup_script_path)
  }, [project])

  const handleSave = () => {
    mutate({
      params: {
        path: { project_id: projectId },
        query: {
          rules_file: rulesFile,
          setup_script: setupScript
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span>Rules File</span>
        <Input placeholder="./CLAUDE.md" value={rulesFile} onChange={(e) => setRulesFile(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <span>Setup Script</span>
        <Input placeholder="./scripts/setup.sh" value={setupScript} onChange={(e) => setSetupScript(e.target.value)} />
      </div>
      <div className="text-end">
        <Button onClick={handleSave} loading={isPending}>Next</Button>
      </div>
    </div>
  )
}