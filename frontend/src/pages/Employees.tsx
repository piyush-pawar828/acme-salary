import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmployeeFilters } from "@/components/EmployeeFilters";
import { EmployeeTable } from "@/components/EmployeeTable";
import { Pagination } from "@/components/Pagination";
import { employees } from "@/api/employees";
import { useSearchState } from "@/lib/use-search-state";

const PER_PAGE = 25;

export function Employees() {
  const [state, update] = useSearchState();
  const meta = useQuery({ queryKey: ["meta"], queryFn: employees.meta, staleTime: Infinity });
  const list = useQuery({
    queryKey: ["employees", state],
    queryFn: () => employees.list({ ...state, per_page: PER_PAGE }),
    placeholderData: (previous) => previous,
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button render={<Link to="/employees/new" />}>Add employee</Button>
      </div>

      <EmployeeFilters state={state} meta={meta.data} onChange={update} />

      {list.isError && (
        <Alert variant="destructive">
          <AlertDescription>Could not load employees.</AlertDescription>
        </Alert>
      )}

      {list.isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : list.data ? (
        <>
          <div className={`rounded-md border ${list.isFetching ? "opacity-60" : ""}`}>
            <EmployeeTable employees={list.data.data} />
          </div>
          <Pagination
            page={list.data.meta.page}
            totalPages={list.data.meta.total_pages}
            total={list.data.meta.total}
            perPage={list.data.meta.per_page}
            onPage={(page) => update({ page })}
          />
        </>
      ) : null}
    </div>
  );
}
