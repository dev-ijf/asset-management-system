"use client";

/**
 * Last-resort page for errors in the root or dashboard layout (e.g. the login check cannot reach
 * the database). It replaces the whole document, so it carries its own minimal styling.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f6fa", color: "#1f2a44" }}>
        <main style={{ maxWidth: 520, margin: "15vh auto", padding: 24, background: "#fff", borderRadius: 8, border: "1px solid #e4e6ef" }}>
          <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Aplikasi gagal dimuat</h1>
          <p style={{ fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
            Biasanya karena koneksi ke database terputus sesaat. Coba muat ulang; jika masih gagal, hubungi administrator dan
            sertakan kode di bawah.
          </p>
          {error.digest ? <p style={{ fontSize: 12, color: "#6b7895", margin: "0 0 16px" }}>Kode error: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#3212b8", color: "#fff", cursor: "pointer" }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
