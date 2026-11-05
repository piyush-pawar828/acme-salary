// Mirrors the JSON shapes the Rails API returns.

export type User = { id: number; name: string; email: string };

export type CountryRef = { code: string; name: string; currency_code: string };
export type DepartmentRef = { id: number; name: string };

export type Country = CountryRef & { id: number; usd_rate: string; rate_as_of: string };
/** `today` is the server's calendar date: the single source of truth for date limits. */
export type Meta = { today: string; countries: Country[]; departments: DepartmentRef[] };

export type SalarySummary = {
  amount: string;
  currency_code: string;
  effective_on: string;
  usd: string;
};

export type EmployeeSummary = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  country: CountryRef;
  department: DepartmentRef;
  job_title: string;
  hired_on: string;
  salary: SalarySummary | null;
};

export type SalaryRow = SalarySummary & {
  id: number;
  note: string | null;
  created_by: { id: number; name: string };
  created_at: string;
};

export type EmployeeDetail = EmployeeSummary & { salary_history: SalaryRow[] };

export type Page<T> = {
  data: T[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
};

export type EmployeeInput = {
  first_name: string;
  last_name: string;
  email: string;
  country_id: number | "";
  department_id: number | "";
  job_title: string;
  hired_on: string;
};

export type SalaryInput = { amount: string; effective_on: string; note?: string };

export type Overview = {
  headcount: number;
  total_payroll_usd: string;
  mean_usd: string;
  median_usd: string;
  min_usd: string;
  max_usd: string;
  countries: number;
  departments: number;
};

export type GroupDimension = "country" | "department";

export type GroupStat = {
  key: string | number;
  label: string;
  headcount: number;
  total_usd: string;
  mean_usd: string;
  median_usd: string;
  min_usd: string;
  max_usd: string;
};

export type Extremes = { top: EmployeeSummary[]; bottom: EmployeeSummary[] };
