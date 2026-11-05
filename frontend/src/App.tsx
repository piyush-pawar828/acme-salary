import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Employees } from "@/pages/Employees";
import { EmployeeNew } from "@/pages/EmployeeNew";
import { EmployeeDetail } from "@/pages/EmployeeDetail";
import { Dashboard } from "@/pages/Dashboard";
import { session } from "@/api/session";
import type { User } from "@/api/types";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Shell() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    session
      .current()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // Any 401 from the API drops the session and returns to login.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      queryClient.clear();
      navigate("/login", { replace: true });
    };
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, [navigate]);

  async function logout() {
    await session.logout();
    setUser(null);
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  if (user === undefined) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/employees" replace /> : <Login onLogin={setUser} />} />
      {user ? (
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeNew />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
