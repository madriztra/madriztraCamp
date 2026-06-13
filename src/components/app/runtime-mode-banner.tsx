import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function RuntimeModeBanner() {
  const modes = [
    ["AI", process.env.AI_PROVIDER ?? "local"],
    ["Storage", process.env.STORAGE_DRIVER ?? "local"],
    ["Queue", process.env.QUEUE_DRIVER ?? "local"],
    ["Publishing", process.env.PUBLISHING_MODE ?? "sandbox"]
  ];

  const isSafeMode = modes.some(([, value]) => ["local", "sandbox"].includes(value));
  const tone = isSafeMode
    ? {
        border: "border-emerald-500/20",
        background: "bg-emerald-500/10",
        icon: "bg-emerald-500/15 text-emerald-300",
        title: "text-emerald-100",
        body: "text-emerald-100/70",
        heading: "Free and safe runtime enabled",
        copy: "Paid APIs and social publishing are disabled unless explicitly switched to live mode.",
        badge: "success" as const
      }
    : {
        border: "border-primary/25",
        background: "bg-primary/10",
        icon: "bg-primary/15 text-primary",
        title: "text-primary-foreground",
        body: "text-muted-foreground",
        heading: "Live integrations enabled",
        copy: "AI, storage, queue, and publishing are using live providers from environment configuration.",
        badge: "default" as const
      };

  return (
    <div className={`mb-6 rounded-lg border ${tone.border} ${tone.background} p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-md p-2 ${tone.icon}`}>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-sm font-medium ${tone.title}`}>{tone.heading}</p>
            <p className={`mt-1 text-sm ${tone.body}`}>{tone.copy}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {modes.map(([label, value]) => (
            <Badge key={label} variant={tone.badge}>
              {label}: {value}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
