import Link from "next/link";
import { Check } from "lucide-react";
import { ApprovalStatus, ApprovalTransactionType } from "@/generated/prisma/client";
import { MaintenancePhotoThumbs } from "@/components/maintenance/maintenance-photo-thumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/asset-transaction-view";
import { addDays, wibFormat } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

/** Finished, rejected or cancelled requests stay visible this long. */
const DONE_VISIBLE_DAYS = 30;
const LIMIT = 20;
const STEPS = ["Diajukan", "Disetujui", "Dikerjakan", "Selesai"] as const;

type Stage = {
  /** Index of the reached step in STEPS; -1 when the request stopped (rejected / cancelled). */
  step: number;
  label: string;
  variant: "warning" | "info" | "primary" | "success" | "danger" | "default";
};

function stageOf(status: ApprovalStatus, maintenanceStatus: string | null): Stage {
  if (status === ApprovalStatus.PENDING) return { step: 0, label: "Menunggu persetujuan", variant: "warning" };
  if (status === ApprovalStatus.REJECTED) return { step: -1, label: "Ditolak", variant: "danger" };
  if (status === ApprovalStatus.CANCELLED) return { step: -1, label: "Dibatalkan", variant: "default" };
  if (maintenanceStatus === "COMPLETED") return { step: 3, label: "Selesai", variant: "success" };
  if (maintenanceStatus === "IN_PROGRESS") return { step: 2, label: "Sedang dikerjakan", variant: "primary" };
  if (maintenanceStatus === "CANCELLED") return { step: -1, label: "Maintenance dibatalkan", variant: "default" };
  return { step: 1, label: "Disetujui, menunggu dikerjakan", variant: "info" };
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Tahapan pengajuan">
      {STEPS.map((name, index) => {
        const done = index <= step;
        return (
          <li key={name} className="flex items-center gap-1">
            <span
              title={name}
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                done ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className={`hidden text-[11px] sm:inline ${done ? "text-[var(--text)]" : "text-[var(--muted)]"}`}>{name}</span>
            {index < STEPS.length - 1 ? <span className={`h-px w-3 ${index < step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The teacher's maintenance requests and how far each has come: waiting for approval,
 * approved, being worked on, done. Approved requests stay here until the work is finished
 * (and for a while after), instead of disappearing at approval.
 */
export async function ClassMaintenanceTracker({ userId }: { userId: string }) {
  const since = addDays(new Date(), -DONE_VISIBLE_DAYS);
  const requests = await prisma.assetApprovalRequest.findMany({
    where: {
      requesterId: userId,
      transactionType: ApprovalTransactionType.MAINTENANCE,
      OR: [
        { status: ApprovalStatus.PENDING },
        { status: ApprovalStatus.APPROVED, maintenance: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
        { reviewedAt: { gte: since } },
        { maintenance: { updatedAt: { gte: since } } },
      ],
    },
    include: {
      asset: { select: { id: true, code: true, name: true } },
      reviewedBy: { select: { name: true } },
      maintenance: { select: { status: true, scheduledDate: true, completedDate: true, updatedAt: true } },
      photos: { select: { id: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });

  const time = wibFormat({ day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const active = requests.filter((request) => {
    const step = stageOf(request.status, request.maintenance?.status ?? null).step;
    return step >= 0 && step < 3;
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengajuan Maintenance Saya</CardTitle>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {active > 0 ? `${active} pengajuan masih berjalan. ` : ""}
          Pantau tahapannya di sini: diajukan, disetujui, dikerjakan, selesai. Pengajuan yang sudah selesai, ditolak, atau
          dibatalkan tetap tampil selama {DONE_VISIBLE_DAYS} hari.
        </p>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Belum ada pengajuan maintenance. Gunakan tombol Ajukan Maintenance pada asset kelas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="whitespace-nowrap bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2">Asset</th>
                  <th className="px-3 py-2">Kerusakan</th>
                  <th className="px-3 py-2">Diajukan</th>
                  <th className="px-3 py-2">Tahapan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {requests.map((request) => {
                  const maintenance = request.maintenance;
                  const stage = stageOf(request.status, maintenance?.status ?? null);
                  const payload = (request.payload ?? {}) as { description?: unknown };
                  const by = request.reviewedBy?.name ?? "-";
                  return (
                    <tr key={request.id} className="align-top">
                      <td className="px-3 py-2 font-medium">
                        <Link href={`/dashboard/my-class/${request.asset.id}`} className="hover:text-[var(--primary)] hover:underline">
                          {request.asset.code} - {request.asset.name}
                        </Link>
                      </td>
                      <td className="max-w-[20rem] px-3 py-2 [overflow-wrap:break-word]">
                        {typeof payload.description === "string" ? payload.description : "-"}
                        <MaintenancePhotoThumbs photoIds={request.photos.map((photo) => photo.id)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{time.format(request.createdAt)}</td>
                      <td className="px-3 py-2">
                        {stage.step >= 0 ? <Progress step={stage.step} /> : <span className="text-[var(--muted)]">Berhenti</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge variant={stage.variant}>{stage.label}</Badge>
                      </td>
                      <td className="max-w-[20rem] px-3 py-2 [overflow-wrap:break-word]">
                        {request.status === ApprovalStatus.REJECTED ? (
                          <>
                            <span className="text-[var(--danger)]">{request.rejectNote ?? "Tanpa alasan"}</span>
                            <span className="block text-[var(--muted)]">
                              oleh {by}
                              {request.reviewedAt ? `, ${time.format(request.reviewedAt)}` : ""}
                            </span>
                          </>
                        ) : request.status === ApprovalStatus.APPROVED ? (
                          <span className="block space-y-0.5 text-[var(--muted)]">
                            <span className="block">
                              Disetujui oleh {by}
                              {request.reviewedAt ? `, ${time.format(request.reviewedAt)}` : ""}
                            </span>
                            {maintenance?.scheduledDate && maintenance.status !== "COMPLETED" ? (
                              <span className="block">Jadwal: {formatDate(maintenance.scheduledDate)}</span>
                            ) : null}
                            {maintenance?.status === "COMPLETED" ? (
                              <span className="block text-[var(--text)]">
                                Selesai {maintenance.completedDate ? formatDate(maintenance.completedDate) : time.format(maintenance.updatedAt)}
                              </span>
                            ) : null}
                          </span>
                        ) : request.status === ApprovalStatus.PENDING ? (
                          <span className="text-[var(--muted)]">Menunggu ditinjau tim asset</span>
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
