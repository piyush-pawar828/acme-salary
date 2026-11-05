import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { label: string; value: React.ReactNode; hint?: string };

export function StatCard({ label, value, hint }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
