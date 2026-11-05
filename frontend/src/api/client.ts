export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors: FieldErrors;

  constructor(status: number, errors: FieldErrors) {
    super(`API error ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

// Thin fetch wrapper: JSON in/out, same-origin cookies, typed errors.
// A 401 anywhere dispatches a window event so the app can redirect to login.
export async function api<T = undefined>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("unauthorized"));
    throw new ApiError(response.status, data.errors ?? { base: [response.statusText] });
  }

  return data as T;
}
