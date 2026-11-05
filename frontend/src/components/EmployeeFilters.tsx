import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/NativeSelect";
import type { Meta } from "@/api/types";
import type { SearchState } from "@/lib/query-string";

type Props = {
  state: SearchState;
  meta: Meta | undefined;
  onChange: (patch: Partial<SearchState>) => void;
};

export function EmployeeFilters({ state, meta, onChange }: Props) {
  // Debounce typing so each keystroke does not hit the API. Local text is
  // keyed on the URL value so navigating (back button) resets the box.
  const [draft, setDraft] = useState<{ base: string; text: string }>({ base: state.q, text: state.q });
  const q = draft.base === state.q ? draft.text : state.q;
  useEffect(() => {
    if (q === state.q) return;
    const handle = setTimeout(() => onChange({ q }), 300);
    return () => clearTimeout(handle);
  }, [q, state.q, onChange]);
  const setQ = (text: string) => setDraft({ base: state.q, text });

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_200px_200px_220px]">
      <div className="grid gap-1.5">
        <Label htmlFor="q">Search</Label>
        <Input id="q" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="country">Country</Label>
        <NativeSelect id="country" value={state.country} onChange={(e) => onChange({ country: e.target.value })}>
          <option value="">All countries</option>
          {meta?.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="department">Department</Label>
        <NativeSelect id="department" value={state.department} onChange={(e) => onChange({ department: e.target.value })}>
          <option value="">All departments</option>
          {meta?.departments.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sort">Sort</Label>
        <NativeSelect
          id="sort"
          value={`${state.sort}:${state.dir}`}
          onChange={(e) => {
            const [sort, dir] = e.target.value.split(":") as [SearchState["sort"], SearchState["dir"]];
            onChange({ sort, dir });
          }}
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="salary:desc">Salary high → low (USD)</option>
          <option value="salary:asc">Salary low → high (USD)</option>
          <option value="hired_on:desc">Newest hires</option>
          <option value="hired_on:asc">Longest tenure</option>
        </NativeSelect>
      </div>
    </div>
  );
}
