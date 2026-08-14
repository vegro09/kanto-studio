import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/studio/$id")({
  head: () => ({
    meta: [
      { title: "Studio — Kanto Motion" },
      { name: "description", content: "Antigravity motion studio workspace" },
      { property: "og:title", content: "Studio — Kanto Motion" },
      { property: "og:description", content: "Antigravity motion studio workspace" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { id } = Route.useParams();
  const [title, setTitle] = useState(id === "new" ? "Untitled Project" : `Project ${id}`);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full max-w-md bg-transparent text-center text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Project title"
        />
      </header>
      <main className="pt-16">
        {/* ANTIGRAVITY ENGINE MOUNT POINT - DO NOT ALTER UI STRUCTURE */}
        <div
          id="studio-engine-placeholder"
          className="h-[calc(100vh-4rem)] w-full bg-background"
        />
        {/* ANTIGRAVITY ENGINE MOUNT POINT - DO NOT ALTER UI STRUCTURE */}
      </main>
    </div>
  );
}
