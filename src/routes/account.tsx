import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PricingTierCard } from "@/components/pricing-tier";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Kanto Motion" },
      { name: "description", content: "Manage your Kanto Motion account and subscription" },
      { property: "og:title", content: "Account — Kanto Motion" },
      { property: "og:description", content: "Manage your Kanto Motion account and subscription" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Personal experiments and small drafts.",
    features: ["3 projects", "720p export", "Community support"],
    highlighted: false,
  },
  {
    name: "Creator",
    price: "$12",
    period: "/mo",
    description: "For independent creators shipping regularly.",
    features: ["Unlimited projects", "1080p export", "Priority support"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    description: "For teams and professionals who need control.",
    features: ["Unlimited projects", "4K export", "Dedicated support", "Team collaboration"],
    highlighted: true,
  },
];

function AccountPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12 border-b border-border pb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Kanto</h1>
          <p className="mt-2 text-muted-foreground">Current plan: Creator</p>
        </div>
        <h2 className="mb-6 text-xl font-semibold text-foreground">Choose your tier</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <PricingTierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </main>
    </div>
  );
}
