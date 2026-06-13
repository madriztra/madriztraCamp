import Link from "next/link";
import { AudioLines, BarChart3, CalendarClock, Gauge, Link2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/songs", label: "Songs", icon: AudioLines },
  { href: "/campaigns", label: "Campaigns", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/smart-links", label: "Links", icon: Link2 }
];

export function MobileNav() {
  return (
    <nav className="glass-panel fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-lg p-1 lg:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <item.icon className="h-4 w-4" />
          <span className="max-w-full truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
