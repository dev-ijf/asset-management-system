import { notFound } from "next/navigation";
import { AssetClassesPage } from "@/components/master/asset-classes-page";
import { AssetCategoriesPage } from "@/components/master/asset-categories-page";
import { AssetLocationsPage } from "@/components/master/asset-locations-page";
import { AssetStatusesPage } from "@/components/master/asset-statuses-page";
import { AssetUsersPage } from "@/components/master/asset-users-page";
import { DepartmentsPage } from "@/components/master/departments-page";
import { ModulePage } from "@/components/dashboard/module-page";
import { PersonInChargePage } from "@/components/master/person-in-charge-page";
import { UnitsPage } from "@/components/master/units-page";
import { VendorContractsPage } from "@/components/master/vendor-contracts-page";
import { WarrantiesPage } from "@/components/master/warranties-page";
import { masterPages } from "@/lib/module-pages";

export const dynamic = "force-dynamic";

export default async function MasterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ masterPage: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { masterPage } = await params;
  const { q } = await searchParams;
  const config = masterPages[masterPage];

  if (!config) {
    notFound();
  }

  if (masterPage === "asset-statuses") {
    return <AssetStatusesPage search={q} />;
  }

  if (masterPage === "asset-categories") {
    return <AssetCategoriesPage search={q} />;
  }

  if (masterPage === "asset-locations") {
    return <AssetLocationsPage search={q} />;
  }

  if (masterPage === "asset-classes") {
    return <AssetClassesPage search={q} />;
  }

  if (masterPage === "units") {
    return <UnitsPage search={q} />;
  }

  if (masterPage === "departments") {
    return <DepartmentsPage search={q} />;
  }

  if (masterPage === "person-in-charge") {
    return <PersonInChargePage search={q} />;
  }

  if (masterPage === "asset-users") {
    return <AssetUsersPage search={q} />;
  }

  if (masterPage === "warranties") {
    return <WarrantiesPage search={q} />;
  }

  if (masterPage === "vendor-contracts") {
    return <VendorContractsPage search={q} />;
  }

  return <ModulePage config={config} />;
}
