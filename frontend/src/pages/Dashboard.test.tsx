import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./Dashboard";

const groups = vi.fn();
vi.mock("@/api/analytics", () => ({
  analytics: {
    overview: () =>
      Promise.resolve({
        headcount: 5, total_payroll_usd: "320000.0", mean_usd: "64000.0", median_usd: "60000.0",
        min_usd: "30000.0", max_usd: "100000.0", countries: 2, departments: 2,
      }),
    groups: (by: string) => groups(by),
    extremes: () => Promise.resolve({ top: [], bottom: [] }),
  },
}));

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    groups.mockImplementation((by: string) =>
      Promise.resolve([
        { key: by === "country" ? "US" : 1, label: by === "country" ? "United States" : "Engineering", headcount: 3,
          total_usd: "240000.0", mean_usd: "80000.0", median_usd: "80000.0", min_usd: "60000.0", max_usd: "100000.0" },
      ]),
    );
  });

  it("shows overview figures labelled as converted USD", async () => {
    renderDashboard();
    expect(await screen.findByText("$320,000.00")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getAllByText(/USD \(converted\)/).length).toBeGreaterThan(0);
  });

  it("switches the group dimension and refetches", async () => {
    renderDashboard();
    expect(await screen.findByText("United States")).toBeInTheDocument();
    expect(groups).toHaveBeenCalledWith("country");

    await userEvent.click(screen.getByRole("button", { name: /by department/i }));

    await waitFor(() => expect(groups).toHaveBeenCalledWith("department"));
    expect(await screen.findByText("Engineering")).toBeInTheDocument();
  });
});
