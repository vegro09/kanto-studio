import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Motion" },
      { name: "description", content: "Monochrome motion design workspace" },
      { property: "og:title", content: "Kanto Motion" },
      { property: "og:description", content: "Monochrome motion design workspace" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/auth" replace />;
}
