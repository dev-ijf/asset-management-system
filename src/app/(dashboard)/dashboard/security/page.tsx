import Link from "next/link";
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAnyPermission } from "@/lib/asset-transaction-view";

const securityMenus = [
  {
    title: "Users",
    href: "/dashboard/users",
    description: "Kelola akun login, password, role, dan direct permission.",
    icon: Users,
  },
  {
    title: "Roles",
    href: "/dashboard/roles",
    description: "Kelola role dan permission yang melekat pada role.",
    icon: ShieldCheck,
  },
  {
    title: "Permissions",
    href: "/dashboard/permissions",
    description: "Kelola daftar permission untuk server-side authorization.",
    icon: KeyRound,
  },
];

export default async function SecurityPage() {
  await requireAnyPermission(["users.manage", "roles.manage", "permissions.manage"]);

  return (
    <>
      <PageHeader title="Security" subtitle="Manajemen user, role, dan permission untuk akses sistem." />
      <section className="grid gap-4 md:grid-cols-3">
        {securityMenus.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:border-[var(--primary)] hover:shadow-sm">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--muted)]">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </>
  );
}
