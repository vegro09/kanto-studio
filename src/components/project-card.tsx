import { Link } from "@tanstack/react-router";
import { Trash2, Film } from "lucide-react";
import type { Project } from "@/lib/projectStore";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const displayTitle = project.name || project.title || "Untitled Motion";
  const dateStr = project.lastModified || project.createdAt;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="group relative flex aspect-[4/3] flex-col justify-between rounded-md border border-border bg-background p-6 transition-colors hover:bg-secondary">
      <Link
        to="/studio/$id"
        params={{ id: project.id }}
        className="absolute inset-0 z-0"
        aria-label={`Open project ${displayTitle}`}
      />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary text-foreground">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:underline">
              {displayTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Edited {formattedDate}
            </p>
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive cursor-pointer"
            title="Delete project"
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="relative z-10 mt-4 flex items-center justify-between">
        <span className="inline-flex items-center rounded-sm border border-border px-2 py-1 text-xs font-mono text-muted-foreground">
          #{project.id.slice(-6)}
        </span>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Open Studio →
        </span>
      </div>
    </div>
  );
}
