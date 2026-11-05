import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Meta } from "@/api/types";
import type { SearchState } from "@/lib/query-string";

type Props = {
  state: SearchState;
  meta: Meta | undefined;
  onChange: (patch: Partial<SearchState>) => void;
};

const ALL = "__all__";

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
        <Label>Country</Label>
        <Select value={state.country || ALL} onValueChange={(v) => onChange({ country: !v || v === ALL ? "" : v })}>
          <SelectTrigger aria-label="Country">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All countries</SelectItem>
            {meta?.countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Department</Label>
        <Select value={state.department || ALL} onValueChange={(v) => onChange({ department: !v || v === ALL ? "" : v })}>
          <SelectTrigger aria-label="Department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {meta?.departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Sort</Label>
        <Select
          value={`${state.sort}:${state.dir}`}
          onValueChange={(v) => {
            if (!v) return;
            const [sort, dir] = v.split(":") as [SearchState["sort"], SearchState["dir"]];
            onChange({ sort, dir });
          }}
        >
          <SelectTrigger aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name:asc">Name A–Z</SelectItem>
            <SelectItem value="name:desc">Name Z–A</SelectItem>
            <SelectItem value="salary:desc">Salary high → low (USD)</SelectItem>
            <SelectItem value="salary:asc">Salary low → high (USD)</SelectItem>
            <SelectItem value="hired_on:desc">Newest hires</SelectItem>
            <SelectItem value="hired_on:asc">Longest tenure</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
