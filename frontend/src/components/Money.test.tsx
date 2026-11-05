import { render, screen } from "@testing-library/react";
import { Money } from "./Money";

describe("Money", () => {
  it("shows the local amount and a labelled USD conversion", () => {
    render(<Money amount="8000000.0" currency="INR" usd="96000.0" />);
    expect(screen.getByText("₹8,000,000.00")).toBeInTheDocument();
    expect(screen.getByText(/\$96,000\.00/)).toHaveTextContent("USD (converted)");
  });

  it("hides the USD line when no conversion is given", () => {
    render(<Money amount="100000.0" currency="USD" />);
    expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    expect(screen.queryByText(/converted/)).not.toBeInTheDocument();
  });
});
