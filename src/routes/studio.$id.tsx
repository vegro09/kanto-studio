import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { getProject, saveProject, createProject } from "@/lib/projectStore";

// Lazily import the studio engine -- treated as a protected module.
const StudioEngine = lazy(
  () => import("../engine/components/StudioEngine"),
);

export const Route = createFileRoute("/studio/$id")({
  head: () => ({
    meta: [
      { title: "Studio — Kanto Motion" },
      { name: "description", content: "Antigravity motion studio workspace" },
      { property: "og:title", content: "Studio — Kanto Motion" },
      {
        property: "og:description",
        content: "Antigravity motion studio workspace",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("Untitled Motion");
  const [saveStatus, setSaveStatus] = useState<string>("Saved");
  const [mounted, setMounted] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load project on mount or initialize if missing
  useEffect(() => {
    const existing = getProject(id);
    if (existing) {
      setTitle(existing.name || existing.title || "Untitled Motion");
    } else {
      const initialTitle = id === "new" ? "Untitled Motion" : `Project ${id}`;
      setTitle(initialTitle);
      saveProject({
        id,
        name: initialTitle,
        title: initialTitle,
        createdAt: new Date().toISOString(),
      });
    }
  }, [id]);

  // Handle project title updates with autosave to localStorage
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("Saving…");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProject({
        id,
        name: newTitle.trim() || "Untitled Motion",
        title: newTitle.trim() || "Untitled Motion",
      });
      setSaveStatus("Saved");
    }, 400);
  };

  const handleBackToDashboard = () => {
    // Ensure final save before leaving
    saveProject({
      id,
      name: title.trim() || "Untitled Motion",
      title: title.trim() || "Untitled Motion",
    });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground select-none font-sans">
      {/* Studio Header Bar */}
      <header className="z-50 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4 backdrop-blur-sm">
        {/* 1. Back to Dashboard button */}
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
          title="Return to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* 2. Project Title Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-56 sm:w-72 bg-transparent text-center text-sm font-semibold text-foreground outline-none border-b border-transparent hover:border-border focus:border-foreground/50 transition-colors px-2 py-0.5 placeholder:text-muted-foreground truncate"
            placeholder="Untitled Motion"
            aria-label="Project Title"
          />
        </div>

        {/* 3. Autosave & Project Tag */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded border border-border bg-secondary/40 px-2 py-1 text-[11px] font-mono text-muted-foreground">
            <Check className="h-3 w-3 text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
            #{id.slice(-6)}
          </span>
        </div>
      </header>

      {/* Main Studio Engine Canvas */}
      <main className="h-[calc(100vh-3rem)] w-full flex-1 overflow-hidden bg-background">
        <div
          id="studio-engine-placeholder"
          className="h-full w-full overflow-hidden"
        >
          {mounted ? (
            <Suspense fallback={<StudioLoader />}>
              <StudioEngine
                key={id}
                projectId={id}
                onSaveStatusChange={setSaveStatus}
              />
            </Suspense>
          ) : (
            <StudioLoader />
          )}
        </div>
      </main>
    </div>
  );
}

function StudioLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      <p className="text-sm font-medium text-muted-foreground">
        Loading studio engine…
      </p>
    </div>
  );
}
