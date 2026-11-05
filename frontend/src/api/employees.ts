import { api } from "./client";
import type { EmployeeDetail, EmployeeInput, EmployeeSummary, Meta, Page, SalaryInput } from "./types";

export type EmployeeQuery = {
  q?: string;
  country?: string;
  department?: string;
  sort?: string;
  dir?: string;
  page?: number;
  per_page?: number;
};

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const employees = {
  meta: () => api<Meta>("/api/meta"),
  list: (query: EmployeeQuery) => api<Page<EmployeeSummary>>(`/api/employees${toQueryString(query)}`),
  get: (id: number | string) => api<EmployeeDetail>(`/api/employees/${id}`),
  create: (employee: EmployeeInput, salary: SalaryInput) =>
    api<EmployeeDetail>("/api/employees", { method: "POST", body: { employee, salary } }),
  update: (id: number, employee: Partial<EmployeeInput>) =>
    api<EmployeeDetail>(`/api/employees/${id}`, { method: "PATCH", body: { employee } }),
  remove: (id: number) => api(`/api/employees/${id}`, { method: "DELETE" }),
  addSalary: (id: number, salary: SalaryInput) =>
    api<EmployeeDetail>(`/api/employees/${id}/salaries`, { method: "POST", body: { salary } }),
};
