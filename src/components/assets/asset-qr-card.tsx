"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Printer } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssetQrCardProps = {
  assetCode: string;
  assetName: string;
  qrToken: string;
};

export function AssetQrCard({ assetCode, assetName, qrToken }: AssetQrCardProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [scanUrl, setScanUrl] = useState("");

  const scanPath = useMemo(() => `/asset-view/${encodeURIComponent(qrToken)}`, [qrToken]);

  useEffect(() => {
    const url = new URL(scanPath, window.location.origin).toString();
    setScanUrl(url);

    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      width: 240,
      color: {
        dark: "#001f4f",
        light: "#ffffff",
      },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [scanPath]);

  function downloadQr() {
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${assetCode}-qr.png`;
    link.click();
  }

  function printQr() {
    if (!dataUrl) {
      return;
    }

    const escapedCode = escapeHtml(assetCode);
    const escapedName = escapeHtml(assetName);
    const escapedScanUrl = escapeHtml(scanUrl);
    const printWindow = window.open("", "_blank", "width=420,height=560");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapedCode} QR</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #001f4f; text-align: center; }
            img { width: 240px; height: 240px; }
            .code { font-size: 18px; font-weight: 700; margin-top: 16px; }
            .name { font-size: 14px; margin-top: 6px; color: #4b587c; }
            .url { margin-top: 16px; overflow-wrap: anywhere; font-size: 11px; color: #4b587c; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR ${escapedCode}" />
          <div class="code">${escapedCode}</div>
          <div class="name">${escapedName}</div>
          <div class="url">${escapedScanUrl}</div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Asset</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-[var(--border)] bg-white p-4 text-center">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR ${assetCode}`} className="mx-auto h-60 w-60" />
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-[var(--muted)]">QR belum bisa ditampilkan.</div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Public Scan URL</p>
          <a href={scanPath} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 break-all text-sm font-medium text-[var(--primary)] hover:underline">
            {scanUrl || scanPath}
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={downloadQr} disabled={!dataUrl}>
            <Download className="h-4 w-4" />
            Download QR
          </Button>
          <Button variant="outline" size="sm" onClick={printQr} disabled={!dataUrl}>
            <Printer className="h-4 w-4" />
            Print QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
