import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/Money";
import { formatDate } from "@/lib/dates";
import type { SalaryRow } from "@/api/types";

type Props = { rows: SalaryRow[]; currentId?: number };

export function SalaryHistory({ rows, currentId }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Effective from</TableHead>
          <TableHead className="text-right">Annual salary</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Recorded by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              {formatDate(row.effective_on)}
              {row.id === currentId && (
                <Badge variant="secondary" className="ml-2">
                  Current
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Money amount={row.amount} currency={row.currency_code} usd={row.usd} />
            </TableCell>
            <TableCell className="text-muted-foreground">{row.note ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.created_by.name}
              <div className="text-xs">{formatDate(row.created_at.slice(0, 10))}</div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
