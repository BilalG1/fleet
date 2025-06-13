import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { components } from "@/generated/openapi";
import { formatUTCDate } from "@/lib/date";
import { useNavigate } from "react-router";
import TaskTableActions from "./task-table-actions";

type Props = {
  projectId: string;
  tasks?: components["schemas"]["TaskPublic"][];
  loading: boolean;
}

export default function TestTable({ projectId, tasks, loading }: Props) {
  const navigate = useNavigate();

  const handleRowClick = (testId: string) => {
    navigate(`/project/${projectId}/task/${testId}`);
  };

  return (
    <div className="border border-gray-600 rounded-md overflow-clip">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-gray-700">
          <TableRow>
            <TableHead className="w-full md:w-auto">Title</TableHead>
            <TableHead className="w-24 md:w-auto">Status</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="text-end w-16 md:w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
            </TableRow>
          ) : tasks?.map((task) => (
            <TableRow key={task.id} onClick={() => handleRowClick(task.id)} className="border-gray-700">
              <TableCell className="truncate">{task.title}</TableCell>
              <TableCell className="text-gray-300 truncate">{task.status}</TableCell>
              <TableCell className="text-gray-300 truncate hidden md:table-cell">{formatUTCDate(task.created_at)}</TableCell>
              <TableCell className="text-end py-0.5">
                <TaskTableActions />
              </TableCell>
            </TableRow>
          ))}
          {!loading && tasks && tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">No tasks found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
