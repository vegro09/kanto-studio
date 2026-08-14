import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Motion — Dashboard" },
      { name: "description", content: "Monochrome motion design workspace dashboard" },
      { property: "og:title", content: "Kanto Motion — Dashboard" },
      { property: "og:description", content: "Monochrome motion design workspace dashboard" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Navigate to="/dashboard" replace />;
}
