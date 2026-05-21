import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireReportsView } from "@/lib/basic-reports";

const reports = [
  { title: "Assets", href: "/dashboard/reports/assets", description: "Report data asset aktif dan master data terkait." },
  { title: "Movements", href: "/dashboard/reports/movements", description: "Report perpindahan asset antar lokasi, departemen, dan user." },
  { title: "Disposals", href: "/dashboard/reports/disposals", description: "Report disposal dan reverse disposal asset." },
  { title: "Audits", href: "/dashboard/reports/audits", description: "Report hasil audit fisik asset." },
  { title: "Batch QR Labels", href: "/dashboard/reports/qr-labels", description: "Cetak label QR asset secara massal." },
];

export default async function ReportsPage() {
  await requireReportsView();

  return (
    <>
      <PageHeader title="Reports" subtitle="Basic report MVP dengan filter dan export CSV." />
      <div className="grid gap-5 md:grid-cols-2">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition hover:border-[var(--primary)] hover:shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle>{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted)]">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
