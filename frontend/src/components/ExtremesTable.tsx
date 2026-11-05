import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";
import type { EmployeeSummary } from "@/api/types";

type Props = { employees: EmployeeSummary[] };

export function ExtremesTable({ employees }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Annual salary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <Link to={`/employees/${e.id}`} className="font-medium hover:underline">
                {e.full_name}
              </Link>
              <div className="text-xs text-muted-foreground">{e.country.name}</div>
            </TableCell>
            <TableCell className="text-sm">
              {e.job_title}
              <div className="text-xs text-muted-foreground">{e.department.name}</div>
            </TableCell>
            <TableCell className="text-right">
              {e.salary && <Money amount={e.salary.amount} currency={e.salary.currency_code} usd={e.salary.usd} />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
