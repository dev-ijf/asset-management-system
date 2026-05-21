import { ModulePage } from "@/components/dashboard/module-page";
import { dashboardPages } from "@/lib/module-pages";

export default function ApprovalsPage() {
  return <ModulePage config={dashboardPages.approvals} />;
}
