"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3ddc97", "#ede6d6", "#9aa4a1", "#5f6f68"];

export function PillarBalanceChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (!data.length) {
    return <p className="text-sm text-text-muted">No generated posts yet.</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={86}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#101512",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ede6d6",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
