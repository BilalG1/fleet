import { StackHandler, StackProvider, StackTheme } from "@stackframe/react";
import { useEffect, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { stackClientApp } from "./stack";
import HomePage from "./components/home/page";
import ProjectPage from "./components/project/page";
import NewProject from "./components/project/new-project/page";
import TaskPage from "./components/task/page";
import TaskListPage from "./components/task/task-list/page";
import ProjectSettingsPage from "./components/project/settings/page";

function HandlerRoutes() {
  const location = useLocation();

  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        retry: 2,
      }
    }
  })

  useEffect(() => {
    let el = document.getElementById(`--stack-theme-mode`);
    if (!el) {
      el = document.createElement("style");
      el.id = `--stack-theme-mode`;
      el.innerHTML = `/* This tag is used by Stack Auth to set the theme in the browser without causing a hydration error (since React ignores additional tags in the <head>). We later use the \`html:has(head > [data-stack-theme=XYZ])\` selector to apply styles based on the theme. */`;
      document.head.appendChild(el);
    }
    el.setAttribute("data-stack-theme", "dark");
  }, []);

  return (
    <Suspense fallback={null}>
      <StackProvider app={stackClientApp}>
        <QueryClientProvider client={queryClient}>
          <StackTheme data-theme="dark">
            <Routes>
              <Route path="/handler/*" element={<HandlerRoutes />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/project/new" element={<NewProject />} />
              <Route path="/project/:project_id" element={<ProjectPage />} />
              <Route path="/project/:project_id/task-list" element={<TaskListPage />} />
              <Route path="/project/:project_id/task/:task_id" element={<TaskPage />} />
              <Route path="/project/:project_id/settings" element={<ProjectSettingsPage />} />
            </Routes>
            <Toaster />
          </StackTheme>
        </QueryClientProvider>
      </StackProvider>
    </Suspense>
  );
} 