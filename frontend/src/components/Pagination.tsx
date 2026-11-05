import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (page: number) => void;
};

export function Pagination({ page, totalPages, total, perPage, onPage }: Props) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
