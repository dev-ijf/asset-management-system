"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, PackageCheck, PackagePlus, Send, Wrench, XCircle } from "lucide-react";
import { requestClassMaintenanceAction, type ClassActionState } from "@/app/(dashboard)/dashboard/my-class/actions";
import {
  approveAssetRequestAction,
  cancelAssetRequestAction,
  createAssetRequestAction,
  fulfillAssetRequestAction,
  rejectAssetRequestAction,
  type AssetRequestActionState,
} from "@/app/(dashboard)/dashboard/asset-requests/actions";
import { FieldError } from "@/components/master/master-form-feedback";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { MaintenancePhotosField } from "@/components/maintenance/maintenance-photos-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/components/ui/toast-provider";
import { useFormAction } from "@/components/ui/use-form-action";
import { REJECT_NOTE_MIN } from "@/lib/approval-types";
import { TEXT_LIMITS } from "@/lib/text-limits";

type State = ClassActionState & AssetRequestActionState;
type Action = (state: State, formData: FormData) => Promise<State>;
const initialState: State = {};

function Feedback({ state }: { state: State }) {
  useActionFeedback(state);
  return null;
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
      <FieldError message={error} />
    </label>
  );
}

/** A failed request (too large, timeout, offline) becomes a message instead of the error page. */
function safeAction(action: Action): Action {
  return async (state, formData) => {
    try {
      return await action(state, formData);
    } catch (error) {
      const digest = (error as { digest?: unknown } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_")) throw error; // redirect / notFound
      console.error(error);
      return { message: "Pengajuan gagal dikirim. Periksa koneksi atau kurangi foto, lalu coba lagi." };
    }
  };
}

/** A button that opens a modal form; the modal closes when the action succeeds. */
function DialogForm({
  action,
  trigger,
  title,
  description,
  submitLabel,
  children,
}: {
  action: Action;
  trigger: (open: () => void) => ReactNode;
  title: string;
  description?: string;
  submitLabel: string;
  children: (state: State, pending: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [safe] = useState(() => safeAction(action));
  const [state, form, pending] = useFormAction(safe, initialState);
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open ? (
        <form {...form}>
          <MasterRecordForm
            title={title}
            description={description}
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                <Send className="h-4 w-4" />
                {pending ? "Mengirim..." : submitLabel}
              </Button>
            }
          >
            {children(state, pending)}
            <Feedback state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

export function ClassMaintenanceButton({ assetId, assetLabel, size = "sm" }: { assetId: string; assetLabel: string; size?: "sm" | "md" }) {
  return (
    <DialogForm
      action={requestClassMaintenanceAction}
      title="Ajukan Maintenance"
      description={`${assetLabel}. Pengajuan dikirim ke tim asset untuk disetujui dan dijadwalkan.`}
      submitLabel="Kirim Pengajuan"
      trigger={(open) => (
        <Button variant="outline" size={size} onClick={open}>
          <Wrench className="h-4 w-4" />
          Ajukan Maintenance
        </Button>
      )}
    >
      {(state, pending) => (
        <>
          <input type="hidden" name="assetId" value={assetId} />
          <Field label="Kerusakan / kebutuhan *" error={state.errors?.description}>
            <Textarea
              name="description"
              rows={3}
              required
              maxLength={TEXT_LIMITS.description}
              placeholder="Contoh: proyektor tidak menyala sejak Senin"
            />
          </Field>
          <Field label="Catatan tambahan" error={state.errors?.notes}>
            <Textarea name="notes" rows={2} maxLength={TEXT_LIMITS.description} />
          </Field>
          <MaintenancePhotosField error={state.errors?.photos} pending={pending} />
        </>
      )}
    </DialogForm>
  );
}

export function AssetRequestCreateButton() {
  return (
    <DialogForm
      action={createAssetRequestAction}
      title="Ajukan Asset Baru"
      description="Pengajuan akan ditinjau tim asset. Setelah disetujui, barang dibeli lalu didaftarkan sebagai asset kelas Anda."
      submitLabel="Kirim Pengajuan"
      trigger={(open) => (
        <Button onClick={open}>
          <PackagePlus className="h-4 w-4" />
          Ajukan Asset Baru
        </Button>
      )}
    >
      {(state) => (
        <>
          <Field label="Nama barang *" error={state.errors?.itemName}>
            <Input name="itemName" required maxLength={TEXT_LIMITS.name} placeholder="Contoh: Kipas angin dinding" />
          </Field>
          <Field label="Jumlah *" error={state.errors?.quantity}>
            <Input name="quantity" type="number" min={1} max={1000} step={1} defaultValue={1} required />
          </Field>
          <Field label="Alasan *" error={state.errors?.reason}>
            <Textarea name="reason" rows={3} required maxLength={TEXT_LIMITS.description} placeholder="Contoh: kelas panas, kipas lama sudah rusak" />
          </Field>
          <Field label="Spesifikasi / catatan" error={state.errors?.notes}>
            <Textarea name="notes" rows={2} maxLength={TEXT_LIMITS.description} />
          </Field>
        </>
      )}
    </DialogForm>
  );
}

/** Actions on one new-asset request, depending on its status and who is looking. */
export function AssetRequestActions({
  id,
  label,
  status,
  isOwner,
  canReview,
  canFulfill,
}: {
  id: string;
  label: string;
  status: string;
  isOwner: boolean;
  canReview: boolean;
  canFulfill: boolean;
}) {
  const buttons: ReactNode[] = [];

  if (status === "PENDING" && canReview) {
    buttons.push(
      <DialogForm
        key="approve"
        action={approveAssetRequestAction}
        title="Setujui Pengajuan"
        description={`Setujui pengajuan ${label}. Setelah barang dibeli dan didaftarkan, tandai sebagai sudah diproses.`}
        submitLabel="Setujui"
        trigger={(open) => (
          <Button variant="success" size="sm" onClick={open}>
            <CheckCircle2 className="h-4 w-4" />
            Setujui
          </Button>
        )}
      >
        {() => <input type="hidden" name="id" value={id} />}
      </DialogForm>,
      <DialogForm
        key="reject"
        action={rejectAssetRequestAction}
        title="Tolak Pengajuan"
        description={`Tolak pengajuan ${label}. Alasan penolakan akan dilihat oleh pengaju.`}
        submitLabel="Tolak"
        trigger={(open) => (
          <Button variant="danger" size="sm" onClick={open}>
            <XCircle className="h-4 w-4" />
            Tolak
          </Button>
        )}
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={id} />
            <Field label="Alasan penolakan *" error={state.errors?.rejectNote}>
              <Textarea name="rejectNote" rows={3} required minLength={REJECT_NOTE_MIN} maxLength={TEXT_LIMITS.description} />
            </Field>
          </>
        )}
      </DialogForm>,
    );
  }

  if (status === "APPROVED" && canFulfill) {
    buttons.push(
      <DialogForm
        key="fulfill"
        action={fulfillAssetRequestAction}
        title="Tandai Sudah Diproses"
        description={`Barang untuk ${label} sudah dibeli dan didaftarkan. Isi kode asset baru agar pengajuan terhubung ke asset-nya.`}
        submitLabel="Simpan"
        trigger={(open) => (
          <Button variant="outline" size="sm" onClick={open}>
            <PackageCheck className="h-4 w-4" />
            Sudah Diproses
          </Button>
        )}
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={id} />
            <Field label="Kode asset" error={state.errors?.assetCode} hint="Opsional. Kode asset yang didaftarkan dari pengajuan ini.">
              <Input name="assetCode" maxLength={TEXT_LIMITS.code} />
            </Field>
            <Field label="Catatan" error={state.errors?.fulfilledNote}>
              <Textarea name="fulfilledNote" rows={2} maxLength={TEXT_LIMITS.description} />
            </Field>
          </>
        )}
      </DialogForm>,
    );
  }

  if (status === "PENDING" && isOwner) {
    buttons.push(
      <DialogForm
        key="cancel"
        action={cancelAssetRequestAction}
        title="Batalkan Pengajuan"
        description={`Batalkan pengajuan ${label}? Pengajuan yang dibatalkan tidak bisa diaktifkan lagi.`}
        submitLabel="Batalkan Pengajuan"
        trigger={(open) => (
          <Button variant="secondary" size="sm" onClick={open}>
            Batalkan
          </Button>
        )}
      >
        {() => <input type="hidden" name="id" value={id} />}
      </DialogForm>,
    );
  }

  return buttons.length ? <div className="flex flex-wrap gap-2">{buttons}</div> : <span className="text-[var(--muted)]">-</span>;
}
