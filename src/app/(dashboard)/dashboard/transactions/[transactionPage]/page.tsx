import { notFound } from "next/navigation";
import { ModulePage } from "@/components/dashboard/module-page";
import { transactionPages } from "@/lib/module-pages";

export function generateStaticParams() {
  return Object.keys(transactionPages).map((transactionPage) => ({ transactionPage }));
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionPage: string }>;
}) {
  const { transactionPage } = await params;
  const config = transactionPages[transactionPage];

  if (!config) {
    notFound();
  }

  return <ModulePage config={config} />;
}
