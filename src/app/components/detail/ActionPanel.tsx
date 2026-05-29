import { useState } from "react";
import type { Contribution, WorkflowAction } from "../../types/contribution";
import { getAvailableActions, ACTION_LABELS } from "../../lib/workflow";
import { ActionModal } from "../modals/ActionModal";
import type { SessionUser } from "../../lib/auth";

interface ActionPanelProps {
  contribution: Contribution;
  currentUser: SessionUser;
  onActionComplete: () => void;
}

export function ActionPanel({ contribution, currentUser, onActionComplete }: ActionPanelProps) {
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null);
  const actions = getAvailableActions(contribution.workflowStatus, currentUser.role);
  const isViewOnly = actions.length === 0 || (actions.length === 1 && actions[0] === "view-detail");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gray-400">Aksi Tersedia</h3>
      {isViewOnly ? (
        <p className="text-sm text-gray-400">Tidak ada aksi tersedia untuk peran Anda pada tahap ini.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.filter((a) => a !== "view-detail").map((action, i) => (
            <button
              key={action}
              onClick={() => setActiveAction(action)}
              className={`w-full rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
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
