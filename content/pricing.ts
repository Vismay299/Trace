export type PricingTier = {
  name: string;
  slug: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  featured: boolean;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Strategy Only",
    slug: "strategy",
    price: "$0",
    cadence: "/ month",
    tagline: "Find your positioning before you post.",
    features: [
      "30-minute onboarding interview",
      "Personal Brand Strategy Doc",
      "5 sample posts",
      "5 manual uploads",
      "PDF download",
    ],
    cta: {
      label: "Start free",
      href: "/signup",
    },
    featured: false,
  },
  {
    name: "Pro",
    slug: "pro",
    price: "$39",
    cadence: "/ month",
    tagline: "For builders ready to publish weekly.",
    features: [
      "Expanded weekly AI budget",
      "GitHub source integration",
      "20 manual uploads",
      "Calendar and voice calibration",
      "Hook variants and citations",
    ],
    cta: {
      label: "Create account",
      href: "/signup?plan=pro",
    },
    featured: true,
  },
  {
    name: "Studio",
    slug: "studio",
    price: "Soon",
    cadence: "/ month",
    tagline: "For ghostwriters and multi-brand operators.",
    features: [
      "Everything in Pro",
      "Up to 5 brands",
      "Unlimited sources",
      "White-label Strategy Doc",
      "Priority generation",
    ],
    cta: {
      label: "Coming soon",
      href: "/waitlist",
    },
    featured: false,
  },
];

export const TIER_LABELS = new Map(
  PRICING_TIERS.map((tier) => [tier.slug, tier.name]),
);
