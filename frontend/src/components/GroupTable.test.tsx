import { render, screen } from "@testing-library/react";
import { GroupTable } from "./GroupTable";
import type { GroupStat } from "@/api/types";

const groups: GroupStat[] = [
  { key: "US", label: "United States", headcount: 3, total_usd: "240000.0", mean_usd: "80000.0", median_usd: "80000.0", min_usd: "60000.0", max_usd: "100000.0" },
  { key: "IN", label: "India", headcount: 2, total_usd: "80000.0", mean_usd: "40000.0", median_usd: "40000.0", min_usd: "30000.0", max_usd: "50000.0" },
];

describe("GroupTable", () => {
  it("renders one row per group with USD-labelled columns", () => {
    render(<GroupTable groups={groups} dimension="country" />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("$240,000.00")).toBeInTheDocument();
    expect(screen.getAllByText(/USD \(converted\)/).length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: /country/i })).toBeInTheDocument();
  });
});
