"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type QrAsset = {
  code: string;
  name: string;
  qrToken: string;
};

type RenderedQrAsset = QrAsset & {
  dataUrl: string;
};

export function BatchQrLabels({ assets }: { assets: QrAsset[] }) {
  const [items, setItems] = useState<RenderedQrAsset[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all(
      assets.map(async (asset) => {
        const scanUrl = new URL(`/asset-view/${encodeURIComponent(asset.qrToken)}`, window.location.origin).toString();
        const dataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, scale: 6, width: 180 });
        return { ...asset, dataUrl };
      }),
    ).then((result) => {
      if (mounted) setItems(result);
    });

    return () => {
      mounted = false;
    };
  }, [assets]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print Label Batch
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-3">
        {items.map((asset) => (
          <div key={asset.qrToken} className="rounded-md border border-[var(--border)] bg-white p-4 text-center print:break-inside-avoid">
            <img src={asset.dataUrl} alt={`QR ${asset.code}`} className="mx-auto h-36 w-36" />
            <p className="mt-3 text-sm font-bold text-[var(--text)]">{asset.code}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{asset.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
