import React from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { UserButton } from '@stackframe/react';
import { NavLink } from "react-router";

type Props = {
  project?: {
    id: string
    repo_name: string
  }
  task?: {
    id: string
    title: string
  },
  projectTab?: "task-list" | "settings"
  actions?: React.ReactNode;
}

export default function ProjectsHeader(props: Props) {
  const breadcrumbs = [
    { label: "Projects", link: `/` },
    { label: props.project?.repo_name, link: `/project/${props.project?.id}` },
    { label: props.projectTab === "settings" && "Settings", link: `/project/${props.project?.id}/settings` },
    { label: props.projectTab === "task-list" && "Tasks", link: `/project/${props.project?.id}/task-list` },
    { label: props.task?.title, link: `/project/${props.project?.id}/task/${props.task?.id}` },
  ]

  return (
    <div className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-700 px-4 justify-between sticky top-0 w-full bg-background z-10">
      <div className="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.filter(item => item.label).map((item, index) => (
              <React.Fragment key={item.label as string}>
                {index > 0 && <BreadcrumbSeparator className="hiddena md:block" />}
                <BreadcrumbItem className={index < breadcrumbs.filter(item => item.label).length - 1 ? "hiddena md:block" : ""}>
                  <BreadcrumbLink asChild>
                    <NavLink to={item.link}>{item.label}</NavLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-4">
        {props.actions}
        <UserButton />
      </div>
    </div>
  );
}