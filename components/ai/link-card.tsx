"use client";

import { Link } from "@/i18n/navigation";
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  PhoneIcon,
  InfoIcon,
  BookOpenIcon,
  UsersIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
} from "lucide-react";

const INTENT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  products: ShoppingBagIcon,
  cart: ShoppingCartIcon,
  checkout: CreditCardIcon,
  contact: PhoneIcon,
  about: InfoIcon,
  blog: BookOpenIcon,
  affiliate: UsersIcon,
  guarantee: ShieldCheckIcon,
  product_page: ShoppingBagIcon,
};

export interface ChatLinkCardProps {
  path: string;
  label: string;
  intent?: string;
}

export function ChatLinkCard({ path, label, intent }: ChatLinkCardProps) {
  const Icon = (intent && INTENT_ICONS[intent]) || ExternalLinkIcon;

  return (
    <Link
      href={path}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      <ExternalLinkIcon className="ml-auto size-3.5 text-muted-foreground" />
    </Link>
  );
}
