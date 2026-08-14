import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazily import the studio engine -- treated as a protected black-box module.
// No internal canvas refs, animation loops, or state have been altered.
const StudioEngine = lazy(
  () => import("../engine/components/StudioEngine"),
);

export const Route = createFileRoute("/studio/$id")({
  head: () => ({
    meta: [
      { title: "Studio — Kanto Motion" },
      { name: "description", content: "Kanto Motion studio workspace" },
      { property: "og:title", content: "Studio — Kanto Motion" },
      { property: "og:description", content: "Kanto Motion studio workspace" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  // The StudioEngine mounts itself full-screen with its own toolbar & panels.
  // We wrap it in a Suspense boundary so the lazy chunk loads gracefully.
  return (
    <div
      id="studio-engine-placeholder"
      className="h-screen w-screen overflow-hidden bg-background text-foreground"
    >
      <Suspense fallback={<StudioLoader />}>
        <StudioEngine />
      </Suspense>
    </div>
  );
}

function StudioLoader() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      <p className="text-sm font-medium text-muted-foreground">
        Loading studio engine…
      </p>
    </div>
  );
}