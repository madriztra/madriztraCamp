import Link from "next/link";
import {
  AudioLines,
  BarChart3,
  CalendarClock,
  Gauge,
  Link2,
  Megaphone,
  Settings,
  Shield,
  UserRound,
  WalletCards
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/songs", label: "Songs", icon: AudioLines },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/scheduler", label: "Scheduler", icon: CalendarClock },
  { href: "/smart-links", label: "Smart Links", icon: Link2 },
  { href: "/accounts", label: "Accounts", icon: WalletCards },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("glass-panel sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 lg:flex", className)}>
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Music Growth OS</p>
          <p className="text-xs text-muted-foreground">Artist command center</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
