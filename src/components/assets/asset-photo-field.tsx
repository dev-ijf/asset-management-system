"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Upload, X } from "lucide-react";

export function AssetPhotoField({ existing, error }: { existing?: { id: string; path: string }; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removed, setRemoved] = useState(false);
  const [localError, setLocalError] = useState("");
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { setFile(null); setPreview(""); setLocalError(""); setRemoved(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  const image = file ? preview : !removed ? existing?.path : undefined;
  return (
    <div className="space-y-3 rounded-md border border-dashed border-[var(--border)] bg-[var(--table-head)] p-4">
      <input type="hidden" name="photoId" value={existing?.id ?? ""} />
      <input type="hidden" name="removePhoto" value={removed ? "1" : "0"} />
      <label className="block text-sm font-medium text-[var(--text)]">
        <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" />Foto Asset</span>
        <input ref={input} name="photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={pending} onChange={event => {
            const selected = event.target.files?.[0] ?? null;
            const message = selected && (!/\.(jpe?g|png|webp)$/i.test(selected.name) || !["image/jpeg", "image/png", "image/webp"].includes(selected.type))
              ? "Format foto harus JPG, JPEG, PNG, atau WebP." : selected && selected.size > 10 * 1024 * 1024 ? "Ukuran foto maksimal 10 MB." : "";
            setLocalError(message);
            event.target.setCustomValidity(message);
            setFile(message ? null : selected);
            if (!message && selected) setRemoved(false);
          }}
          className="mt-3 block w-full rounded-md border border-[var(--border)] bg-white p-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[var(--primary-soft)] file:px-3 file:py-2 file:text-[var(--primary)]" />
      </label>
      <p className="text-xs text-[var(--muted)]">JPG, JPEG, PNG, WebP. Maksimal 10 MB. Foto akan diperkecil saat disimpan.</p>
      {image ? <img src={image} alt="Preview foto asset" className="max-h-48 max-w-full rounded-md object-contain" /> : null}
      {file ? <p className="break-all text-xs text-[var(--muted)]">{file.name}</p> : null}
      {image || file || localError ? <button type="button" disabled={pending} className="inline-flex items-center gap-1 text-sm text-[var(--danger)] disabled:opacity-50"
        onClick={() => { setFile(null); setPreview(""); setRemoved(true); setLocalError(""); if (input.current) { input.current.value = ""; input.current.setCustomValidity(""); } }}>
        <X className="h-4 w-4" />Hapus foto
      </button> : null}
      {removed && existing ? <button type="button" disabled={pending} onClick={() => setRemoved(false)} className="block text-sm text-[var(--primary)]">Batalkan hapus foto</button> : null}
      {localError || error ? <p role="alert" className="text-sm text-[var(--danger)]">{localError || error}</p> : null}
      {pending && file ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Memproses dan mengunggah foto…</p> : null}
    </div>
  );
}
