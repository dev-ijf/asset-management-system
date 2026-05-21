import { ModuleOverview } from "@/components/dashboard/module-overview";
import { transactionPages } from "@/lib/module-pages";

export default function TransactionsPage() {
  const items = Object.entries(transactionPages).map(([slug, config]) => ({
    title: config.title,
    href: `/dashboard/transactions/${slug}`,
    description: config.subtitle,
  }));

  return (
    <ModuleOverview
      title="Transactions"
      subtitle="Kelola aktivitas operasional aset mulai dari perpindahan, disposal, sampai audit fisik."
      label="Menu Transactions"
      items={items}
    />
  );
}
