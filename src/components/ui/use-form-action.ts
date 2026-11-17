"use client";

import { startTransition, useActionState, useCallback, useEffect, useRef, type FormEvent } from "react";

/**
 * useActionState for forms that keeps what the user typed when the server rejects the submit.
 *
 * React 19 resets a `<form action={...}>` after every action, including failed ones, so a
 * validation error wipes the whole form. This hook submits through onSubmit instead, and
 * resets the form only when the action reports `ok: true`.
 *
 * Usage: `const [state, form, pending] = useFormAction(action, initialState);` then `<form {...form}>`.
 * Native validation (`required`, `min`, ...) still runs before onSubmit fires.
 */
export function useFormAction<S>(
  action: (state: Awaited<S>, formData: FormData) => S | Promise<S>,
  initialState: Awaited<S>,
) {
  const [state, dispatch, pending] = useActionState(action, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && (state as { ok?: unknown } | null)?.ok === true) {
      ref.current?.reset();
    }
  }, [state, initialState]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pending) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const formData = new FormData(event.currentTarget, submitter);
      startTransition(() => dispatch(formData));
    },
    [dispatch, pending],
  );

  return [state, { ref, onSubmit }, pending] as const;
}
