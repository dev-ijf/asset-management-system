import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asset Management System",
  description: "Next.js foundation for the asset management dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
