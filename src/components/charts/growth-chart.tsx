"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  date: string;
  views: number;
  clicks: number;
  streams: number;
};

export function GrowthChart({ data }: { data: Point[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full min-w-0 rounded-md bg-secondary/30" />;
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272A" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#A1A1AA", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#A1A1AA", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8 }}
            labelStyle={{ color: "#F4F4F5" }}
          />
          <Area type="monotone" dataKey="views" stroke="#8B5CF6" fill="url(#views)" strokeWidth={2} />
          <Area type="monotone" dataKey="clicks" stroke="#22D3EE" fill="url(#clicks)" strokeWidth={2} />
          <Area type="monotone" dataKey="streams" stroke="#34D399" fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
