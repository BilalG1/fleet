import { toast } from "sonner";
import { Github, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { components } from "@/generated/openapi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "../../api/use-api";

type Props = {
  projectId: string;
  task: components["schemas"]["TaskPublic"];
}

export default function TaskTableActions() {

  const handleOpenInGitHub = () => {
    toast.warning("Not implemented");
  }

  return (
    <div onClick={e => e.stopPropagation()} className="w-min ml-auto mr-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="!ring-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenInGitHub}>
            <Github className="mr-2 h-4 w-4" />
            <span>Open in GitHub</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}