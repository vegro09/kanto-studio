import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Film } from "lucide-react";
import { useState, useEffect } from "react";
import { ProjectCard } from "@/components/project-card";
import { getProjects, createProject, deleteProject, type Project } from "@/lib/projectStore";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kanto Motion" },
      { name: "description", content: "Manage your Kanto Motion projects" },
      { property: "og:title", content: "Dashboard — Kanto Motion" },
      { property: "og:description", content: "Manage your Kanto Motion projects" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const refreshProjects = () => {
    setProjects(getProjects());
  };

  useEffect(() => {
    refreshProjects();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kanto_projects") {
        refreshProjects();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleStartNewProject = () => {
    const newProj = createProject("Untitled Motion");
    refreshProjects();
    navigate({
      to: "/studio/$id",
      params: { id: newProj.id },
    });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    refreshProjects();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, organize, and edit your kinetic motion sequences
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartNewProject}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NewProjectCard onStartNew={handleStartNewProject} />
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-foreground text-background font-mono text-xs font-bold">
            K
          </span>
          Kanto Motion
        </Link>
        <Link
          to="/account"
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Account
        </Link>
      </div>
    </header>
  );
}

function NewProjectCard({ onStartNew }: { onStartNew: () => void }) {
  return (
    <button
      type="button"
      onClick={onStartNew}
      className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-background p-6 transition-all hover:border-foreground/40 hover:bg-secondary cursor-pointer text-left"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background transition-transform group-hover:scale-105 group-hover:bg-secondary">
        <Plus className="h-7 w-7 text-foreground" />
      </div>
      <div className="text-center">
        <span className="text-lg font-semibold text-foreground block">Start New Project</span>
        <span className="text-xs text-muted-foreground">Click to open blank canvas</span>
      </div>
    </button>
  );
}
