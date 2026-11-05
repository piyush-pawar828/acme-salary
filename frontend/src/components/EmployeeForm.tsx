import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/NativeSelect";
import { FieldError } from "@/components/FieldError";
import { todayIso } from "@/lib/dates";
import type { FieldErrors } from "@/api/client";
import type { EmployeeInput, Meta, SalaryInput } from "@/api/types";

type Props = {
  mode: "create" | "edit";
  meta: Meta;
  initial?: EmployeeInput;
  errors?: FieldErrors;
  busy?: boolean;
  onSubmit: (employee: EmployeeInput, salary: SalaryInput) => void | Promise<void>;
  onCancel?: () => void;
};

const EMPTY: EmployeeInput = {
  first_name: "",
  last_name: "",
  email: "",
  country_id: "",
  department_id: "",
  job_title: "",
  hired_on: "",
};

export function EmployeeForm({ mode, meta, initial, errors = {}, busy = false, onSubmit, onCancel }: Props) {
  const [employee, setEmployee] = useState<EmployeeInput>(initial ?? EMPTY);
  const [salary, setSalary] = useState<SalaryInput>({ amount: "", effective_on: "", note: "" });
  const currency = meta.countries.find((c) => c.id === employee.country_id)?.currency_code;

  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setEmployee((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void onSubmit(employee, salary);
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First name" id="first_name" errors={errors.first_name}>
          <Input id="first_name" value={employee.first_name} onChange={(e) => set("first_name", e.target.value)} required />
        </Field>
        <Field label="Last name" id="last_name" errors={errors.last_name}>
          <Input id="last_name" value={employee.last_name} onChange={(e) => set("last_name", e.target.value)} required />
        </Field>
        <Field label="Email" id="email" errors={errors.email}>
          <Input id="email" type="email" value={employee.email} onChange={(e) => set("email", e.target.value)} required />
        </Field>
        <Field label="Job title" id="job_title" errors={errors.job_title}>
          <Input id="job_title" value={employee.job_title} onChange={(e) => set("job_title", e.target.value)} required />
        </Field>
        <Field
          label="Country"
          id="country_id"
          errors={errors.country_id}
          hint={mode === "edit" ? "Country cannot be changed after creation." : undefined}
        >
          <NativeSelect
            id="country_id"
            value={employee.country_id}
            disabled={mode === "edit"}
            onChange={(e) => set("country_id", e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select a country</option>
            {meta.countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.currency_code})
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Department" id="department_id" errors={errors.department_id}>
          <NativeSelect
            id="department_id"
            value={employee.department_id}
            onChange={(e) => set("department_id", e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select a department</option>
            {meta.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Hired on" id="hired_on" errors={errors.hired_on}>
          <Input id="hired_on" type="date" value={employee.hired_on} onChange={(e) => set("hired_on", e.target.value)} required />
        </Field>
      </div>

      {mode === "create" && (
        <fieldset className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Initial salary</legend>
          <Field label="Annual salary" id="salary_amount" errors={errors["salary.amount"]}>
            <div className="flex items-center gap-2">
              <Input
                id="salary_amount"
                type="number"
                min="0.01"
                step="0.01"
                value={salary.amount}
                onChange={(e) => setSalary({ ...salary, amount: e.target.value })}
                required
              />
              <span className="w-12 text-sm text-muted-foreground">{currency ?? "—"}</span>
            </div>
          </Field>
          <Field label="Effective from" id="salary_effective_on" errors={errors["salary.effective_on"]}>
            <Input
              id="salary_effective_on"
              type="date"
              max={todayIso()}
              value={salary.effective_on}
              onChange={(e) => setSalary({ ...salary, effective_on: e.target.value })}
              required
            />
          </Field>
          <Field label="Note" id="salary_note" errors={errors["salary.note"]} className="md:col-span-2">
            <Input id="salary_note" value={salary.note ?? ""} onChange={(e) => setSalary({ ...salary, note: e.target.value })} />
          </Field>
        </fieldset>
      )}

      <FieldError messages={errors.base} />

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {mode === "create" ? "Create employee" : "Save changes"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  errors,
  hint,
  className,
  children,
}: {
  label: string;
  id: string;
  errors?: string[];
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError messages={errors} />
    </div>
  );
}
