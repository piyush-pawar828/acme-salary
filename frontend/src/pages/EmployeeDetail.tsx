import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Money } from "@/components/Money";
import { EmployeeForm } from "@/components/EmployeeForm";
import { SalaryHistory } from "@/components/SalaryHistory";
import { SalaryChangeDialog } from "@/components/SalaryChangeDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { employees } from "@/api/employees";
import { ApiError, type FieldErrors } from "@/api/client";
import { formatDate } from "@/lib/dates";
import type { EmployeeDetail as EmployeeDetailType, EmployeeInput, SalaryInput } from "@/api/types";

function toErrors(error: unknown): FieldErrors {
  return error instanceof ApiError ? error.errors : { base: ["Something went wrong"] };
}

export function EmployeeDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [salaryErrors, setSalaryErrors] = useState<FieldErrors>({});

  const meta = useQuery({ queryKey: ["meta"], queryFn: employees.meta, staleTime: Infinity });
  const employee = useQuery({ queryKey: ["employee", id], queryFn: () => employees.get(id) });

  function replace(detail: EmployeeDetailType) {
    queryClient.setQueryData(["employee", id], detail);
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }

  const update = useMutation({
    mutationFn: (input: EmployeeInput) => employees.update(Number(id), input),
    onSuccess: (detail) => {
      replace(detail);
      setEditing(false);
      setEditErrors({});
    },
    onError: (error) => setEditErrors(toErrors(error)),
  });

  const addSalary = useMutation({
    mutationFn: (salary: SalaryInput) => employees.addSalary(Number(id), salary),
    onSuccess: (detail) => {
      replace(detail);
      setSalaryOpen(false);
      setSalaryErrors({});
    },
    onError: (error) => setSalaryErrors(toErrors(error)),
  });

  const remove = useMutation({
    mutationFn: () => employees.remove(Number(id)),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["employee", id] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      navigate("/employees");
    },
  });

  if (employee.isPending) return <Skeleton className="h-64" />;
  if (employee.isError || !employee.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Employee not found.</AlertDescription>
      </Alert>
    );
  }

  const data = employee.data;
  const initial: EmployeeInput = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    country_id: meta.data?.countries.find((c) => c.code === data.country.code)?.id ?? "",
    department_id: data.department.id,
    job_title: data.job_title,
    hired_on: data.hired_on,
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Employee #{data.id}</p>
          <h1 className="text-2xl font-semibold">{data.full_name}</h1>
          <p className="text-muted-foreground">
            {data.job_title} · {data.department.name} · {data.country.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel edit" : "Edit profile"}
          </Button>
          <SalaryChangeDialog
            open={salaryOpen}
            onOpenChange={(open) => {
              setSalaryOpen(open);
              if (!open) setSalaryErrors({});
            }}
            currency={data.country.currency_code}
            today={meta.data?.today ?? data.hired_on}
            errors={salaryErrors}
            busy={addSalary.isPending}
            onSubmit={(salary) => addSalary.mutate(salary)}
          />
          <ConfirmDelete name={data.full_name} busy={remove.isPending} onConfirm={() => remove.mutate()} />
        </div>
      </div>

      {editing && meta.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeForm
              mode="edit"
              meta={meta.data}
              initial={initial}
              errors={editErrors}
              busy={update.isPending}
              onSubmit={(input) => update.mutate(input)}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Current annual salary</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {data.salary ? <Money amount={data.salary.amount} currency={data.salary.currency_code} usd={data.salary.usd} /> : "—"}
              {data.salary && <p className="mt-1 text-xs font-normal text-muted-foreground">Since {formatDate(data.salary.effective_on)}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div>{data.email}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{formatDate(data.hired_on)}</CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Salary history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <SalaryHistory rows={data.salary_history} currentId={data.salary_history.find((r) => r.effective_on === data.salary?.effective_on && r.amount === data.salary?.amount)?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
