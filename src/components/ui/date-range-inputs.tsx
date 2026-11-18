"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { DATE_RANGE_ERROR } from "@/lib/date-range";

/**
 * The "from" / "to" date inputs of a GET filter form.
 * Blocks submitting a reversed range in the browser; the server still validates it for edited URLs.
 */
export function DateRangeInputs({ from, to }: { from?: string; to?: string }) {
  const [start, setStart] = useState(from ?? "");
  const [end, setEnd] = useState(to ?? "");
  const toInput = useRef<HTMLInputElement>(null);

  // Keep in sync when the page navigates with new search params.
  useEffect(() => setStart(from ?? ""), [from]);
  useEffect(() => setEnd(to ?? ""), [to]);

  const reversed = Boolean(start && end && start > end);
  useEffect(() => {
    toInput.current?.setCustomValidity(reversed ? DATE_RANGE_ERROR : "");
  }, [reversed]);

  return (
    <>
      <Input
        type="date"
        name="from"
        value={start}
        max={end || undefined}
        onChange={(event) => setStart(event.target.value)}
        aria-label="Dari tanggal"
        title="Dari tanggal"
      />
      <Input
        ref={toInput}
        type="date"
        name="to"
        value={end}
        min={start || undefined}
        onChange={(event) => setEnd(event.target.value)}
        aria-label="Sampai tanggal"
        title="Sampai tanggal"
        aria-invalid={reversed || undefined}
        className={reversed ? "border-[var(--danger)]" : undefined}
      />
    </>
  );
}

/** Message shown in place of the results when the URL carries a reversed range. */
export function DateRangeAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-[var(--danger)] bg-[#fff1f0] px-4 py-3 text-sm text-[var(--danger)]">
      {message}
    </p>
  );
}
