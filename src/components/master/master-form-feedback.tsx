"use client";

import { useActionFeedback } from "@/components/ui/toast-provider";

type MasterFormFeedbackState = {
  message?: string;
  errors?: {
    form?: string;
  };
};

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-[var(--danger)]">{message}</p>;
}

export function FormFeedback({ state }: { state: MasterFormFeedbackState }) {
  useActionFeedback(state);
  if (!state.errors?.form && !state.message) {
    return null;
  }

  if (state.errors?.form) {
    return (
      <div className="rounded-md border border-[rgba(255,91,82,0.35)] bg-[#ffecea] px-4 py-3 text-sm font-medium text-[var(--danger)]">
        {state.errors.form}
      </div>
    );
  }

  return null;
}
