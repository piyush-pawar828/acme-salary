import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/FieldError";
import { todayIso } from "@/lib/dates";
import type { FieldErrors } from "@/api/client";
import type { SalaryInput } from "@/api/types";

type FormProps = {
  currency: string;
  errors?: FieldErrors;
  busy?: boolean;
  onSubmit: (salary: SalaryInput) => void | Promise<void>;
};

export function SalaryChangeForm({ currency, errors = {}, busy = false, onSubmit }: FormProps) {
  const [amount, setAmount] = useState("");
  const [effectiveOn, setEffectiveOn] = useState(todayIso());
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setLocalError("Enter an amount greater than zero.");
      return;
    }
    setLocalError(null);
    void onSubmit({ amount, effective_on: effectiveOn, note });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="new_amount">New annual salary ({currency})</Label>
        <Input id="new_amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {localError && <p className="text-xs text-destructive">{localError}</p>}
        <FieldError messages={errors.amount} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new_effective_on">Effective from</Label>
        <Input id="new_effective_on" type="date" max={todayIso()} value={effectiveOn} onChange={(e) => setEffectiveOn(e.target.value)} />
        <FieldError messages={errors.effective_on} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new_note">Note</Label>
        <Input id="new_note" placeholder="e.g. Annual review" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <FieldError messages={errors.base} />
      <Button type="submit" disabled={busy}>
        Save salary
      </Button>
    </form>
  );
}

type DialogProps = FormProps & { open: boolean; onOpenChange: (open: boolean) => void };

export function SalaryChangeDialog({ open, onOpenChange, ...form }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>Change salary</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a salary change</DialogTitle>
          <DialogDescription>The previous salary stays in the history. The date cannot be in the future.</DialogDescription>
        </DialogHeader>
        {open && <SalaryChangeForm {...form} />}
      </DialogContent>
    </Dialog>
  );
}
