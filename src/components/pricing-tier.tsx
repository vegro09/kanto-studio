import { Check } from "lucide-react";

interface Tier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

interface PricingTierCardProps {
  tier: Tier;
}

export function PricingTierCard({ tier }: PricingTierCardProps) {
  if (tier.highlighted) {
    return (
      <div className="flex flex-col rounded-md border border-primary bg-primary p-6 text-primary-foreground">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{tier.name}</h3>
          <p className="mt-1 text-sm opacity-80">{tier.description}</p>
        </div>
        <div className="mb-6">
          <span className="text-3xl font-bold">{tier.price}</span>
          {tier.period && <span className="text-sm opacity-70">{tier.period}</span>}
        </div>
        <ul className="mb-6 flex-1 space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-auto w-full rounded-md border border-primary-foreground bg-primary-foreground px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-foreground/90"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-md border border-border bg-background p-6 text-foreground">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{tier.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      </div>
      <div className="mb-6">
        <span className="text-3xl font-bold">{tier.price}</span>
        {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
      </div>
      <ul className="mb-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-auto w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Select
      </button>
    </div>
  );
}
