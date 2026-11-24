"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

const MAX_PHOTOS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
/** Server actions accept 12 MB per request; leave room for the text fields. */
const MAX_TOTAL_BYTES = 11 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 1600;

/**
 * Phone photos are often 4–8 MB. Shrink them in the browser first (the server compresses
 * again), so three photos fit in one request. Falls back to the original file.
 */
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Up to three photos of the damage, sent as the `photos` field. */
export function MaintenancePhotosField({ error, pending = false }: { error?: string; pending?: boolean }) {
  const picker = useRef<HTMLInputElement>(null);
  const payload = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  // Mirror the chosen files into the hidden input that the form submits.
  useEffect(() => {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    if (payload.current) payload.current.files = transfer.files;
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  async function addFiles(selected: File[]) {
    setLocalError("");
    const room = MAX_PHOTOS - files.length;
    if (selected.length > room) setLocalError(`Maksimal ${MAX_PHOTOS} foto.`);
    const valid = selected.slice(0, Math.max(room, 0)).filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError("Format foto harus JPG, PNG, atau WebP.");
        return false;
      }
      return file.size > 0;
    });
    if (valid.length === 0) return;
    setBusy(true);
    const shrunk = await Promise.all(valid.map(shrinkPhoto));
    setBusy(false);
    const next = [...files, ...shrunk];
    if (shrunk.some((file) => file.size > MAX_BYTES)) {
      setLocalError("Ukuran tiap foto maksimal 10 MB.");
      return;
    }
    if (next.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
      setLocalError("Total ukuran foto terlalu besar. Kurangi jumlah foto.");
      return;
    }
    setFiles(next);
  }

  const message = localError || error;
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-[var(--text)]">Foto kerusakan</span>
      <input ref={payload} type="file" name="photos" multiple hidden tabIndex={-1} aria-hidden="true" />
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addFiles(selected);
        }}
      />
      <div className="flex flex-wrap gap-3">
        {previews.map((url, index) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${index + 1}`} className="h-24 w-24 rounded-md border border-[var(--border)] object-cover" />
            <button
              type="button"
              disabled={pending}
              onClick={() => setFiles(files.filter((_, i) => i !== index))}
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow disabled:opacity-50"
              aria-label={`Hapus foto ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_PHOTOS ? (
          <button
            type="button"
            disabled={pending || busy}
            onClick={() => picker.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--border)] bg-[var(--table-head)] text-xs text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
          >
            <Camera className="h-6 w-6" />
            {busy ? "Memproses..." : "Tambah foto"}
          </button>
        ) : null}
      </div>
      <p className="text-xs text-[var(--muted)]">Opsional, maksimal {MAX_PHOTOS} foto (JPG, PNG, WebP). Foto membantu tim asset memahami kerusakannya.</p>
      {message ? <p role="alert" className="text-sm text-[var(--danger)]">{message}</p> : null}
    </div>
  );
}
