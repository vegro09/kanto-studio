import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ProjectCard } from "@/components/project-card";

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

const sampleProjects = [
  { id: "1", title: "Neon Genesis", createdAt: "2026-08-10" },
  { id: "2", title: "Void Walker", createdAt: "2026-08-12" },
  { id: "3", title: "Silhouette", createdAt: "2026-08-14" },
];

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="mb-10 text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NewProjectCard />
          {sampleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-foreground">
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

function NewProjectCard() {
  return (
    <Link
      to="/studio/$id"
      params={{ id: "new" }}
      className="group flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-md border border-primary bg-background p-6 transition-colors hover:bg-secondary"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:bg-secondary">
        <Plus className="h-7 w-7 text-foreground" />
      </div>
      <span className="text-lg font-semibold text-foreground">Start New Project</span>
    </Link>
  );
}

