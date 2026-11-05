import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeForm } from "@/components/EmployeeForm";
import { employees } from "@/api/employees";
import { ApiError, type FieldErrors } from "@/api/client";
import type { EmployeeInput, SalaryInput } from "@/api/types";

export function EmployeeNew() {
  const navigate = useNavigate();
  const meta = useQuery({ queryKey: ["meta"], queryFn: employees.meta, staleTime: Infinity });
  const [errors, setErrors] = useState<FieldErrors>({});

  const create = useMutation({
    mutationFn: ({ employee, salary }: { employee: EmployeeInput; salary: SalaryInput }) => employees.create(employee, salary),
    onSuccess: (created) => navigate(`/employees/${created.id}`),
    onError: (error) => setErrors(error instanceof ApiError ? error.errors : { base: ["Something went wrong"] }),
  });

  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-2xl font-semibold">Add employee</h1>
      {meta.data ? (
        <EmployeeForm
          mode="create"
          meta={meta.data}
          errors={errors}
          busy={create.isPending}
          onSubmit={(employee, salary) => create.mutate({ employee, salary })}
          onCancel={() => navigate("/employees")}
        />
      ) : (
        <Skeleton className="h-64" />
      )}
    </div>
  );
}
