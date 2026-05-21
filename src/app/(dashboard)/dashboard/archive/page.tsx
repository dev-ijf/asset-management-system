import { ModulePage } from "@/components/dashboard/module-page";
import { dashboardPages } from "@/lib/module-pages";

export default function ArchivePage() {
  return <ModulePage config={dashboardPages.archive} />;
}
