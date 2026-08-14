import { Link } from "@tanstack/react-router";
import { MoreVertical } from "lucide-react";

interface Project {
  id: string;
  title: string;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to="/studio/$id"
      params={{ id: project.id }}
      className="group relative flex aspect-[4/3] flex-col justify-between rounded-md border border-border bg-background p-6 transition-colors hover:bg-secondary"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Project options"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4">
        <span className="inline-flex items-center rounded-sm border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
          Project #{project.id}
        </span>
      </div>
    </Link>
  );
}
