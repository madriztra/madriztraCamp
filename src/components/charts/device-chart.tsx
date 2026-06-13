"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#8B5CF6", "#22D3EE", "#34D399", "#F59E0B", "#71717A"];

export function DeviceChart({ data }: { data: Array<{ _id: string; total: number }> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-56 w-full min-w-0 rounded-md bg-secondary/30" />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="_id" innerRadius={54} outerRadius={84} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry._id} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272A", borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
