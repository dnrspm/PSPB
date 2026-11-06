import { Badge } from "../Badge";
import { VERVAL_STATUS_LABELS, VERVAL_STATUS_VARIANT } from "../../lib/verval";
import type { VervalStatus } from "../../types/contribution";

export function VervalStatusBadge({ status }: { status: VervalStatus }) {
  return (
    <Badge variant={VERVAL_STATUS_VARIANT[status]} className="whitespace-nowrap">
      {VERVAL_STATUS_LABELS[status]}
    </Badge>
  );
}
