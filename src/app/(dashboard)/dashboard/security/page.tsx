import { ModulePage } from "@/components/dashboard/module-page";
import { dashboardPages } from "@/lib/module-pages";

export default function SecurityPage() {
  return <ModulePage config={dashboardPages.security} />;
}
