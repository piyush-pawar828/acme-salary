import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Login } from "./Login";
import { ApiError } from "@/api/client";

const login = vi.fn();
vi.mock("@/api/session", () => ({ session: { login: (...args: unknown[]) => login(...args) } }));

function renderLogin(onLogin = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="/employees" element={<div>Employees page</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return onLogin;
}

describe("Login", () => {
  // Braces matter: a hook that returns the mock would have it run as teardown.
  beforeEach(() => {
    login.mockClear();
  });

  it("submits credentials and navigates on success", async () => {
    login.mockResolvedValue({ id: 1, name: "HR Manager", email: "hr@acme.example" });
    const onLogin = renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "hr@acme.example");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith("hr@acme.example", "secret");
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ id: 1, name: "HR Manager", email: "hr@acme.example" }));
    expect(await screen.findByText("Employees page")).toBeInTheDocument();
  });

  it("shows the server error on 401", async () => {
    login.mockImplementation(() => Promise.reject(new ApiError(401, { base: ["Invalid email or password"] })));
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "hr@acme.example");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});
