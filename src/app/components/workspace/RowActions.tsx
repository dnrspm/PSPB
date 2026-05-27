import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Contribution, WorkflowAction } from "../../types/contribution";
import { getAvailableActions, ACTION_LABELS, ACTION_VARIANTS } from "../../lib/workflow";
import { ActionModal } from "../modals/ActionModal";
import type { SessionUser } from "../../lib/auth";

interface RowActionsProps {
  contribution: Contribution;
  currentUser: SessionUser;
  onActionComplete: () => void;
}

export function RowActions({ contribution, currentUser, onActionComplete }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);

  const actions = getAvailableActions(contribution.workflowStatus, currentUser.role);

  if (actions.length === 0 || (actions.length === 1 && actions[0] === "view-detail")) {
    return <span className="text-sm text-gray-300">—</span>;
  }

  const primaryAction = actions[0];

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setActiveAction(primaryAction)}
        className="rounded px-2 py-0.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 whitespace-nowrap"
      >
        {ACTION_LABELS[primaryAction]}
      </button>

      {actions.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded border border-gray-200 p-0.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                {actions.slice(1).map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setOpen(false);
                      setActiveAction(action);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      ACTION_VARIANTS[action] === "destructive" ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeAction && (
        <ActionModal
          action={activeAction}
          contribution={contribution}
          onClose={() => setActiveAction(null)}
          onSuccess={onActionComplete}
        />
      )}
    </div>
  );
}
