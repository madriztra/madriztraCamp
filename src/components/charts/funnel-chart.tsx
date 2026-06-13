"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FunnelChart({ data }: { data: { views: number; clicks: number; streams: number } }) {
  const [mounted, setMounted] = useState(false);
  const rows = [
    { name: "Views", value: data.views, color: "#8B5CF6" },
    { name: "Clicks", value: data.clicks, color: "#22D3EE" },
    { name: "Streams", value: data.streams, color: "#34D399" }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-56 w-full min-w-0 rounded-md bg-secondary/30" />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "#D4D4D8" }} />
          <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8 }} />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {rows.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
