import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";
import { formatDate } from "@/lib/dates";
import type { EmployeeSummary } from "@/api/types";

type Props = { employees: EmployeeSummary[] };

export function EmployeeTable({ employees }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Job title</TableHead>
          <TableHead className="text-right">Annual salary</TableHead>
          <TableHead>Hired</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
              No employees match these filters.
            </TableCell>
          </TableRow>
        )}
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="text-muted-foreground">#{employee.id}</TableCell>
            <TableCell>
              <Link to={`/employees/${employee.id}`} className="font-medium hover:underline">
                {employee.full_name}
              </Link>
              <div className="text-xs text-muted-foreground">{employee.email}</div>
            </TableCell>
            <TableCell>{employee.country.name}</TableCell>
            <TableCell>{employee.department.name}</TableCell>
            <TableCell>{employee.job_title}</TableCell>
            <TableCell className="text-right">
              {employee.salary ? (
                <Money amount={employee.salary.amount} currency={employee.salary.currency_code} usd={employee.salary.usd} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>{formatDate(employee.hired_on)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
