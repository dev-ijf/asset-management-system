"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef } from "react";
import { Camera, ImagePlus, Star, Trash2 } from "lucide-react";
import {
  deleteAssetPhotoAction,
  setPrimaryAssetPhotoAction,
  uploadAssetPhotoAction,
  type AssetPhotoActionState,
} from "@/app/(dashboard)/dashboard/assets/photo-actions";
import { FieldError } from "@/components/master/master-form-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type AssetPhotoItem = {
  id: string;
  path: string;
  isPrimary: boolean;
};

const initialState: AssetPhotoActionState = {};

function PhotoFeedback({ state }: { state: AssetPhotoActionState }) {
  if (!state.message) {
    return null;
  }

  const className = state.ok
    ? "border border-[rgba(34,197,94,0.35)] bg-[#e7f9ef] text-[#13a251]"
    : "border border-[rgba(255,91,82,0.35)] bg-[#ffecea] text-[var(--danger)]";

  return <div className={`rounded-md px-4 py-3 text-sm font-medium ${className}`}>{state.message}</div>;
}

function UploadPhotoForm({ assetId }: { assetId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(uploadAssetPhotoAction, initialState);

  useEffect(() => {
    if (state.ok && fileRef.current) {
      fileRef.current.value = "";
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--table-head)] p-4">
      <input name="assetId" type="hidden" value={assetId} />
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Upload Foto</span>
        <input
          ref={fileRef}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--primary-soft)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary)]"
        />
        <FieldError message={state.errors?.photo} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          <ImagePlus className="h-4 w-4" />
          {pending ? "Uploading..." : "Upload Foto"}
        </Button>
        <p className="text-xs text-[var(--muted)]">Format jpg, jpeg, png, webp. Maksimal 5 MB.</p>
      </div>
      <PhotoFeedback state={state} />
    </form>
  );
}

function PhotoActionForm({
  action,
  buttonLabel,
  confirmMessage,
  icon,
  photoId,
  variant,
}: {
  action: typeof deleteAssetPhotoAction | typeof setPrimaryAssetPhotoAction;
  buttonLabel: string;
  confirmMessage?: string;
  icon: ReactNode;
  photoId: string;
  variant: "secondary" | "danger" | "outline";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input name="photoId" type="hidden" value={photoId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {icon}
        {pending ? "Memproses..." : buttonLabel}
      </Button>
      <PhotoFeedback state={state} />
    </form>
  );
}

export function AssetPhotoSection({
  assetId,
  canManage,
  photos,
}: {
  assetId: string;
  canManage: boolean;
  photos: AssetPhotoItem[];
}) {
  const primaryPhoto = photos.find((photo) => photo.isPrimary) ?? photos[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Foto Aset</CardTitle>
          {primaryPhoto ? <Badge>Primary: tersedia</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {primaryPhoto ? (
          <div className="overflow-hidden rounded-md border border-[var(--border)] bg-slate-50">
            <img src={primaryPhoto.path} alt="Primary asset" className="h-72 w-full object-cover" />
          </div>
        ) : null}

        {canManage ? <UploadPhotoForm assetId={assetId} /> : null}

        {photos.length === 0 ? (
          <EmptyState title="Belum ada foto asset." description="Foto asset akan tampil di sini setelah diupload." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
                <div className="relative">
                  <img src={photo.path} alt="Foto asset" className="h-40 w-full object-cover" />
                  {photo.isPrimary ? (
                    <div className="absolute left-3 top-3">
                      <Badge>Primary</Badge>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Camera className="h-4 w-4" />
                    <span className="truncate">{photo.path.split("/").pop()}</span>
                  </div>
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      {!photo.isPrimary ? (
                        <PhotoActionForm
                          action={setPrimaryAssetPhotoAction}
                          buttonLabel="Set Primary"
                          icon={<Star className="h-4 w-4" />}
                          photoId={photo.id}
                          variant="outline"
                        />
                      ) : null}
                      <PhotoActionForm
                        action={deleteAssetPhotoAction}
                        buttonLabel="Delete"
                        confirmMessage="Hapus foto asset ini?"
                        icon={<Trash2 className="h-4 w-4" />}
                        photoId={photo.id}
                        variant="danger"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
