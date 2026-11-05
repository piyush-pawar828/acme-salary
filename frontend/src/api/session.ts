import { api } from "./client";
import type { User } from "./types";

export const session = {
  current: () => api<User>("/api/session"),
  login: (email: string, password: string) => api<User>("/api/session", { method: "POST", body: { email, password } }),
  logout: () => api("/api/session", { method: "DELETE" }),
};
