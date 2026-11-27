"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Printer } from "lucide-react";

type QrAsset = { code: string; name: string; qrToken: string };

/** QR side length on paper. Small fits more labels per A4 sheet; still scans fine from a phone. */
const SIZES = {
  small: { label: "Kecil (2,5 cm)", qr: "25mm", code: "7pt" },
  medium: { label: "Sedang (3,5 cm)", qr: "35mm", code: "8.5pt" },
} as const;
type Size = keyof typeof SIZES;

const BATCH = 50;

/** Renders QR codes as SVG in small batches, so thousands of assets do not freeze the tab. */
function useQrSvgs(assets: QrAsset[]) {
  const [svgs, setSvgs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const result: string[] = [];
    setSvgs([]);

    async function run() {
      for (let start = 0; start < assets.length && !cancelled; start += BATCH) {
        const batch = assets.slice(start, start + BATCH);
        const rendered = await Promise.all(
          batch.map((asset) => {
            const url = new URL(`/asset-view/${encodeURIComponent(asset.qrToken)}`, window.location.origin).toString();
            return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
          }),
        );
        result.push(...rendered.map((svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`));
        if (!cancelled) setSvgs([...result]);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [assets]);

  return svgs;
}

export function QrLabelSheet({ assets, filtered }: { assets: QrAsset[]; filtered: boolean }) {
  const [size, setSize] = useState<Size>("small");
  const [showName, setShowName] = useState(false);
  const svgs = useQrSvgs(assets);
  const ready = svgs.length === assets.length;
  const spec = SIZES[size];

  return (
    <div className="min-h-screen bg-[var(--background,#f5f6fa)] print:bg-white">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-white px-4 py-3 shadow-sm print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <a
            href="/dashboard/assets"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--text)] hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Data Asset
          </a>
          <div className="mr-auto">
            <p className="text-sm font-semibold text-[var(--text)]">Print QR Asset</p>
            <p className="text-xs text-[var(--muted)]">
              {assets.length} asset{filtered ? " sesuai filter Data Asset" : " (semua asset aktif)"}
              {ready ? "" : ` · membuat QR ${svgs.length}/${assets.length}…`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            Ukuran
            <select
              value={size}
              onChange={(event) => setSize(event.target.value as Size)}
              className="h-9 rounded-md border border-[var(--border)] bg-white px-2 text-sm"
            >
              {(Object.keys(SIZES) as Size[]).map((key) => (
                <option key={key} value={key}>
                  {SIZES[key].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={showName} onChange={(event) => setShowName(event.target.checked)} />
            Tampilkan nama asset
          </label>
          <button
            type="button"
            disabled={!ready || assets.length === 0}
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {ready ? "Print" : "Menyiapkan…"}
          </button>
        </div>
      </div>

      {assets.length === 0 ? (
        <p className="p-8 text-center text-sm text-[var(--muted)]">Tidak ada asset untuk dicetak.</p>
      ) : (
        <div className="mx-auto max-w-6xl p-4 print:max-w-none print:p-0">
          <div className="flex flex-wrap justify-center gap-[3mm] bg-white p-[4mm] print:justify-start print:p-0">
            {assets.map((asset, index) => (
              <div
                key={asset.qrToken}
                className="flex flex-col items-center border border-dashed border-slate-300 p-[2mm] [break-inside:avoid]"
                style={{ width: `calc(${spec.qr} + 4mm)` }}
              >
                {svgs[index] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svgs[index]} alt={`QR ${asset.code}`} style={{ width: spec.qr, height: spec.qr }} />
                ) : (
                  <div className="animate-pulse bg-slate-100" style={{ width: spec.qr, height: spec.qr }} />
                )}
                <p className="mt-[1mm] w-full break-all text-center font-bold leading-tight text-black" style={{ fontSize: spec.code }}>
                  {asset.code}
                </p>
                {showName ? (
                  <p className="w-full truncate text-center leading-tight text-slate-600" style={{ fontSize: "6pt" }}>
                    {asset.name}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
