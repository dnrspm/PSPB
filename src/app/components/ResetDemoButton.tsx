import { RotateCcw } from "lucide-react";
import { resetContributions } from "../data/mockWorkspace";

export function ResetDemoButton() {
  const handleClick = () => {
    const ok = window.confirm(
      "Reset data demo ke kondisi awal?\nSemua perubahan status akan dikembalikan (mis. c022 kembali ke Audiensi - Konfirmasi Lanjut PKS)."
    );
    if (ok) resetContributions();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Reset data demo ke kondisi awal"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-md transition-colors hover:bg-gray-50 hover:text-gray-900"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </button>
  );
}
