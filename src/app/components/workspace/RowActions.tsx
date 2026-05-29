import { useNavigate } from "react-router";
import type { Contribution } from "../../types/contribution";

interface RowActionsProps {
  contribution: Contribution;
}

export function RowActions({ contribution }: RowActionsProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/workspace/${contribution.id}`)}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
    >
      Lihat Detail
    </button>
  );
}
