import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { User } from "@/api/types";

type Props = { user: User; onLogout: () => void };

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-muted" : "text-muted-foreground hover:text-foreground"}`;

export function Layout({ user, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold">ACME Salary Manager</span>
            <nav className="flex gap-1">
              <NavLink to="/employees" className={linkClass}>
                Employees
              </NavLink>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user.name}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
