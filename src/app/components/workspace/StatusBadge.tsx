import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../../lib/workflow";
import type { WorkflowState } from "../../types/contribution";
import { cn } from "../ui/utils";

interface StatusBadgeProps {
  state: WorkflowState;
  className?: string;
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  const colors = WORKFLOW_STATE_COLORS[state];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium truncate max-w-full",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {WORKFLOW_STATE_LABELS[state]}
    </span>
  );
}
