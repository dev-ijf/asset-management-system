import { Download, Filter, Plus, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ModulePageConfig = {
  title: string;
  subtitle: string;
  primaryAction?: string;
  secondaryAction?: string;
  stats: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  filters: string[];
  columns: string[];
  emptyTitle: string;
  noteTitle: string;
  note: string;
};

const statTones = [
  "border-[var(--primary)] bg-[#f6f3ff]",
  "border-[#03a9e8] bg-[#f1fbff]",
  "border-[var(--success)] bg-[#f3fcf6]",
  "border-[var(--warning)] bg-[#fffaf0]",
];

export function ModulePage({ config }: { config: ModulePageConfig }) {
  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {config.secondaryAction ? (
              <Button variant="outline">
                <Download className="h-4 w-4" />
                {config.secondaryAction}
              </Button>
            ) : null}
            {config.primaryAction ? (
              <Button>
                <Plus className="h-4 w-4" />
                {config.primaryAction}
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.stats.map((stat, index) => (
          <Card key={stat.label} className={`border-l-4 ${statTones[index % statTones.length]}`}>
            <CardContent>
              <p className="text-sm text-[var(--muted)]">{stat.label}</p>
              <p className="mt-2 text-3xl font-medium text-[var(--text)]">{stat.value}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Daftar Data</CardTitle>
          <div className="flex flex-wrap gap-2">
            {config.filters.map((filter) => (
              <Badge key={filter} variant="primary">
                {filter}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <input
                className="h-10 w-full rounded-md border border-[var(--border)] bg-white px-4 pr-10 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(50,18,184,0.15)]"
                placeholder="Cari data"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
            <Button variant="secondary">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          <DataTable columns={config.columns} emptyTitle={config.emptyTitle} />
        </CardContent>
      </Card>

      <section className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-white p-5">
        <p className="font-medium text-[var(--text)]">{config.noteTitle}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{config.note}</p>
      </section>
    </>
  );
}
