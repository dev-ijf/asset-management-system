import { ModulePage } from "@/components/dashboard/module-page";
import { dashboardPages } from "@/lib/module-pages";

export default function SettingsPage() {
  return <ModulePage config={dashboardPages.settings} />;
}
