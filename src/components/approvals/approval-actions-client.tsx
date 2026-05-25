"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  approveApprovalRequestAction,
  rejectApprovalRequestAction,
  type ApprovalActionState,
} from "@/app/(dashboard)/dashboard/approvals/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";

const initialState: ApprovalActionState = {};

function Feedback({ state }: { state: ApprovalActionState }) {
  if (!state.message) return null;

  return (
    <div
      className={
        state.ok
          ? "rounded-md border border-[rgba(34,197,94,0.35)] bg-[#e7f9ef] px-4 py-3 text-sm font-medium text-[#13a251]"
          : "rounded-md border border-[rgba(255,91,82,0.35)] bg-[#ffecea] px-4 py-3 text-sm font-medium text-[var(--danger)]"
      }
    >
      {state.message}
    </div>
  );
}

export function ApproveButton({ approvalId, label }: { approvalId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(approveApprovalRequestAction, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button variant="success" size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" />
        Approve
      </Button>
      {open ? (
        <form action={formAction}>
          <ConfirmDialog
            title="Approve Request"
            description={`Setujui request ${label}. Perubahan asset akan diterapkan dan history akan dicatat.`}
            confirmLabel="Approve"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={approvalId} />
            <Feedback state={state} />
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function RejectButton({ approvalId, label }: { approvalId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(rejectApprovalRequestAction, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        Reject
      </Button>
      {open ? (
        <form action={formAction}>
          <ConfirmDialog
            title="Reject Request"
            description={`Tolak request ${label}. Asset tidak akan berubah dan history rejected akan dicatat.`}
            confirmLabel="Reject"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={approvalId} />
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Catatan reject optional</span>
              <Textarea name="rejectNote" className="mt-2" placeholder="Alasan penolakan..." />
            </label>
            <div className="mt-3">
              <Feedback state={state} />
            </div>
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}
