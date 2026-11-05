import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalaryChangeForm } from "./SalaryChangeDialog";

describe("SalaryChangeForm", () => {
  it("rejects an empty amount client-side", async () => {
    const onSubmit = vi.fn();
    render(<SalaryChangeForm currency="INR" today="2026-01-15" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /save salary/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/enter an amount/i)).toBeInTheDocument();
  });

  it("defaults and caps the effective date at the server's today, not the browser's", () => {
    render(<SalaryChangeForm currency="INR" today="2026-01-15" onSubmit={vi.fn()} />);
    const date = screen.getByLabelText(/effective from/i);
    expect(date).toHaveValue("2026-01-15");
    expect(date).toHaveAttribute("max", "2026-01-15");
  });

  it("submits a valid payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SalaryChangeForm currency="INR" today="2026-01-15" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/new annual salary/i), "1250000");
    await userEvent.clear(screen.getByLabelText(/effective from/i));
    await userEvent.type(screen.getByLabelText(/effective from/i), "2026-10-01");
    await userEvent.type(screen.getByLabelText(/note/i), "Promotion");
    await userEvent.click(screen.getByRole("button", { name: /save salary/i }));
    expect(onSubmit).toHaveBeenCalledWith({ amount: "1250000", effective_on: "2026-10-01", note: "Promotion" });
  });

  it("shows a server error for the date", () => {
    render(<SalaryChangeForm currency="INR" today="2026-01-15" onSubmit={vi.fn()} errors={{ effective_on: ["cannot be in the future"] }} />);
    expect(screen.getByText("cannot be in the future")).toBeInTheDocument();
  });
});
