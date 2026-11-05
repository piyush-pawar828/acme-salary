import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EmployeeTable } from "./EmployeeTable";
import type { EmployeeSummary } from "@/api/types";

const ada: EmployeeSummary = {
  id: 7,
  first_name: "Ada",
  last_name: "Lovelace",
  full_name: "Ada Lovelace",
  email: "ada@acme.example",
  country: { code: "IN", name: "India", currency_code: "INR" },
  department: { id: 1, name: "Engineering" },
  job_title: "Software Engineer",
  hired_on: "2020-01-15",
  salary: { amount: "8000000.0", currency_code: "INR", effective_on: "2026-01-01", usd: "96000.0" },
};

describe("EmployeeTable", () => {
  it("renders a row per employee with local and converted salary", () => {
    render(
      <MemoryRouter>
        <EmployeeTable employees={[ada, { ...ada, id: 8, full_name: "Grace Hopper" }]} />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getAllByText("₹8,000,000.00")).toHaveLength(2);
    expect(screen.getAllByText(/USD \(converted\)/)).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Ada Lovelace/ })).toHaveAttribute("href", "/employees/7");
  });

  it("shows an empty state", () => {
    render(
      <MemoryRouter>
        <EmployeeTable employees={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no employees match/i)).toBeInTheDocument();
  });
});
