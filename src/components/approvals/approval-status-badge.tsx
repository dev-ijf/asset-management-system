import { ApprovalStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === ApprovalStatus.PENDING) return <Badge variant="warning">PENDING</Badge>;
  if (status === ApprovalStatus.APPROVED) return <Badge variant="success">APPROVED</Badge>;
  if (status === ApprovalStatus.REJECTED) return <Badge variant="danger">REJECTED</Badge>;
  return <Badge>{status}</Badge>;
}
