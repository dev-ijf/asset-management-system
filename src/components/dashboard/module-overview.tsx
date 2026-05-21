import Link from "next/link";
import { ArrowRight, LayoutGrid, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ModuleOverviewItem = {
  title: string;
  href: string;
  description: string;
  status?: string;
};

type ModuleOverviewProps = {
  title: string;
  subtitle: string;
  label: string;
  items: ModuleOverviewItem[];
};

export function ModuleOverview({ title, subtitle, label, items }: ModuleOverviewProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-[var(--primary)] bg-[#f6f3ff]">
          <CardContent>
            <p className="text-sm text-[var(--muted)]">Total Menu</p>
            <p className="mt-2 text-3xl font-medium text-[var(--text)]">{items.length}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">Layout sudah siap untuk semua submenu.</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-[#03a9e8] bg-[#f1fbff]">
          <CardContent>
            <p className="text-sm text-[var(--muted)]">Status Layout</p>
            <p className="mt-2 text-3xl font-medium text-[var(--text)]">Draft</p>
            <p className="mt-3 text-xs text-[var(--muted)]">Belum terhubung ke data backend.</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-[var(--success)] bg-[#f3fcf6]">
          <CardContent>
            <p className="text-sm text-[var(--muted)]">Mode</p>
            <p className="mt-2 text-3xl font-medium text-[var(--text)]">CRUD</p>
            <p className="mt-3 text-xs text-[var(--muted)]">Siap untuk list, filter, form, dan export.</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{label}</CardTitle>
          <Badge variant="primary">Foundation</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-[var(--border)] bg-white p-5 transition hover:border-[var(--primary)] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
                </div>
                <p className="mt-4 font-semibold text-[var(--text)]">{item.title}</p>
                <p className="mt-2 min-h-12 text-sm text-[var(--muted)]">{item.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                  <ListChecks className="h-4 w-4" />
                  {item.status ?? "Layout tersedia"}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
