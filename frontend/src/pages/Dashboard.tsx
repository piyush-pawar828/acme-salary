import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatCard } from "@/components/StatCard";
import { GroupTable } from "@/components/GroupTable";
import { GroupBarChart } from "@/components/GroupBarChart";
import { ExtremesTable } from "@/components/ExtremesTable";
import { analytics } from "@/api/analytics";
import { formatMoney } from "@/lib/money";
import type { GroupDimension } from "@/api/types";

const USD_HINT = "USD (converted)";

export function Dashboard() {
  const [dimension, setDimension] = useState<GroupDimension>("country");
  const overview = useQuery({ queryKey: ["analytics", "overview"], queryFn: analytics.overview });
  const groups = useQuery({ queryKey: ["analytics", "groups", dimension], queryFn: () => analytics.groups(dimension) });
  const extremes = useQuery({ queryKey: ["analytics", "extremes"], queryFn: analytics.extremes });

  if (overview.isError || groups.isError || extremes.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Could not load analytics.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">How ACME pays people</h1>
        <p className="text-sm text-muted-foreground">
          Salaries are stored in local currency. Cross-country figures use a fixed exchange rate table and are labelled as converted USD.
        </p>
      </div>

      {overview.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Headcount" value={overview.data.headcount.toLocaleString()} hint={`${overview.data.countries} countries · ${overview.data.departments} departments`} />
          <StatCard label="Total annual payroll" value={formatMoney(overview.data.total_payroll_usd, "USD")} hint={USD_HINT} />
          <StatCard label="Median salary" value={formatMoney(overview.data.median_usd, "USD")} hint={USD_HINT} />
          <StatCard label="Average salary" value={formatMoney(overview.data.mean_usd, "USD")} hint={`${USD_HINT} · range ${formatMoney(overview.data.min_usd, "USD")} – ${formatMoney(overview.data.max_usd, "USD")}`} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Pay by {dimension}</CardTitle>
            <CardDescription>Median annual salary per {dimension}, {USD_HINT}.</CardDescription>
          </div>
          <div className="flex gap-1" role="group" aria-label="Group by">
            <Button size="sm" variant={dimension === "country" ? "default" : "outline"} onClick={() => setDimension("country")}>
              By country
            </Button>
            <Button size="sm" variant={dimension === "department" ? "default" : "outline"} onClick={() => setDimension("department")}>
              By department
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {groups.data ? (
            <>
              <GroupBarChart groups={groups.data} />
              <div className="overflow-x-auto rounded-md border">
                <GroupTable groups={groups.data} dimension={dimension} />
              </div>
            </>
          ) : (
            <Skeleton className="h-64" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Highest paid</CardTitle>
            <CardDescription>Top 10 by {USD_HINT}.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">{extremes.data ? <ExtremesTable employees={extremes.data.top} /> : <Skeleton className="mx-6 h-64" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lowest paid</CardTitle>
            <CardDescription>Bottom 10 by {USD_HINT}.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">{extremes.data ? <ExtremesTable employees={extremes.data.bottom} /> : <Skeleton className="mx-6 h-64" />}</CardContent>
        </Card>
      </div>
    </div>
  );
}
