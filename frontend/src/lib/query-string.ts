// Directory list state lives in the URL so views are shareable and the
// back button works. Only non-default values are written.
export type SearchState = {
  q: string;
  country: string;
  department: string;
  sort: "name" | "salary" | "hired_on";
  dir: "asc" | "desc";
  page: number;
};

export const DEFAULT_SEARCH: SearchState = { q: "", country: "", department: "", sort: "name", dir: "asc", page: 1 };

const SORTS = new Set(["name", "salary", "hired_on"]);

export function parseSearch(params: URLSearchParams): SearchState {
  const sort = params.get("sort") ?? "";
  const page = Number.parseInt(params.get("page") ?? "", 10);
  return {
    q: params.get("q") ?? "",
    country: params.get("country") ?? "",
    department: params.get("department") ?? "",
    sort: (SORTS.has(sort) ? sort : "name") as SearchState["sort"],
    dir: params.get("dir") === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

export function serializeSearch(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_SEARCH) as (keyof SearchState)[]) {
    if (state[key] !== DEFAULT_SEARCH[key]) params.set(key, String(state[key]));
  }
  return params;
}
