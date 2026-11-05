import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeForm } from "./EmployeeForm";
import type { Meta } from "@/api/types";

const meta: Meta = {
  countries: [
    { id: 1, code: "US", name: "United States", currency_code: "USD", usd_rate: "1.0", rate_as_of: "2026-11-01" },
    { id: 2, code: "IN", name: "India", currency_code: "INR", usd_rate: "0.012", rate_as_of: "2026-11-01" },
  ],
  departments: [
    { id: 10, name: "Engineering" },
    { id: 11, name: "Sales" },
  ],
  today: "2026-01-15",
};

describe("EmployeeForm", () => {
  it("submits the employee and initial salary in the API shape", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmployeeForm mode="create" meta={meta} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/email/i), "grace@acme.example");
    await userEvent.selectOptions(screen.getByLabelText(/country/i), "2");
    await userEvent.selectOptions(screen.getByLabelText(/department/i), "11");
    await userEvent.type(screen.getByLabelText(/job title/i), "Engineer");
    await userEvent.type(screen.getByLabelText(/hired on/i), "2024-03-01");
    await userEvent.type(screen.getByLabelText(/annual salary/i), "1000000");
    await userEvent.type(screen.getByLabelText(/effective from/i), "2024-03-01");
    await userEvent.click(screen.getByRole("button", { name: /create employee/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        first_name: "Grace",
        last_name: "Hopper",
        email: "grace@acme.example",
        country_id: 2,
        department_id: 11,
        job_title: "Engineer",
        hired_on: "2024-03-01",
      },
      { amount: "1000000", effective_on: "2024-03-01", note: "" },
    );
  });

  it("caps the initial salary date at the server's today", () => {
    render(<EmployeeForm mode="create" meta={meta} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/effective from/i)).toHaveAttribute("max", "2026-01-15");
  });

  it("shows the selected country's currency next to the salary", async () => {
    render(<EmployeeForm mode="create" meta={meta} onSubmit={vi.fn()} />);
    await userEvent.selectOptions(screen.getByLabelText(/country/i), "2");
    expect(screen.getByText("INR")).toBeInTheDocument();
  });

  it("disables country in edit mode and omits salary fields", () => {
    render(
      <EmployeeForm
        mode="edit"
        meta={meta}
        initial={{ first_name: "Ada", last_name: "L", email: "a@b.c", country_id: 1, department_id: 10, job_title: "Eng", hired_on: "2020-01-01" }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/country/i)).toBeDisabled();
    expect(screen.getByText(/country cannot be changed/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/annual salary/i)).not.toBeInTheDocument();
  });

  it("shows server field errors under the fields", () => {
    render(
      <EmployeeForm
        mode="create"
        meta={meta}
        onSubmit={vi.fn()}
        errors={{ email: ["has already been taken"], "salary.amount": ["must be greater than 0"] }}
      />,
    );
    expect(screen.getByText("has already been taken")).toBeInTheDocument();
    expect(screen.getByText("must be greater than 0")).toBeInTheDocument();
  });
});
