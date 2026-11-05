import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";
import type { GroupStat } from "@/api/types";

type Props = { groups: GroupStat[] };

// Single series, single hue: median USD salary per group as horizontal bars,
// so long country/department names read naturally. Values live in the
// tooltip and the table beside the chart, not on every bar.
export function GroupBarChart({ groups }: Props) {
  const data = groups.map((g) => ({ label: g.label, median: Number(g.median_usd), headcount: g.headcount }));
  const height = Math.max(160, data.length * 36 + 24);

  return (
    <div style={{ height }} role="img" aria-label="Median annual salary by group, in USD (converted)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barSize={14}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="label" width={130} tick={{ fill: "var(--foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 12 }}
            formatter={(value, _name, item) => [
              `${formatMoney(Number(value), "USD")} USD (converted) · ${(item.payload as { headcount: number }).headcount.toLocaleString()} employees`,
              "Median",
            ]}
          />
          <Bar dataKey="median" fill="var(--primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
