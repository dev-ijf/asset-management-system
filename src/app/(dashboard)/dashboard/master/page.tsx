import { ModuleOverview } from "@/components/dashboard/module-overview";
import { masterPages } from "@/lib/module-pages";

export default function MasterPage() {
  const items = Object.entries(masterPages).map(([slug, config]) => ({
    title: config.title,
    href: `/dashboard/master/${slug}`,
    description: config.subtitle,
  }));

  return (
    <ModuleOverview
      title="Master Data"
      subtitle="Pusat referensi untuk status, klasifikasi, satuan, departemen, lokasi, pengguna, dan garansi aset."
      label="Menu Master Data"
      items={items}
    />
  );
}
