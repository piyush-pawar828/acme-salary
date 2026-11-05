import { formatMoney } from "@/lib/money";

type Props = {
  amount: string | number;
  currency: string;
  /** USD-converted figure from the API. Rendered with an explicit label. */
  usd?: string | number | null;
  className?: string;
};

// Every USD figure in the app goes through here so the "converted" label
// is never forgotten.
export function Money({ amount, currency, usd, className }: Props) {
  return (
    <span className={className}>
      <span className="tabular-nums">{formatMoney(amount, currency)}</span>
      {usd != null && (
        <span className="block text-xs text-muted-foreground tabular-nums">
          ≈ {formatMoney(usd, "USD")} USD (converted)
        </span>
      )}
    </span>
  );
}
