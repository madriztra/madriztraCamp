import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "text-primary"
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{formatCompactNumber(value)}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </CardContent>
    </Card>
  );
}
