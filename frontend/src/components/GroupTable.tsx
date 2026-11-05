import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import type { GroupDimension, GroupStat } from "@/api/types";

type Props = { groups: GroupStat[]; dimension: GroupDimension };

const USD = <span className="block text-[10px] font-normal text-muted-foreground">USD (converted)</span>;

export function GroupTable({ groups, dimension }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dimension === "country" ? "Country" : "Department"}</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
          <TableHead className="text-right">Total payroll {USD}</TableHead>
          <TableHead className="text-right">Median {USD}</TableHead>
          <TableHead className="text-right">Average {USD}</TableHead>
          <TableHead className="text-right">Min {USD}</TableHead>
          <TableHead className="text-right">Max {USD}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((g) => (
          <TableRow key={String(g.key)}>
            <TableCell className="font-medium">{g.label}</TableCell>
            <TableCell className="text-right tabular-nums">{g.headcount.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(g.total_usd, "USD")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(g.median_usd, "USD")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(g.mean_usd, "USD")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(g.min_usd, "USD")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(g.max_usd, "USD")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
