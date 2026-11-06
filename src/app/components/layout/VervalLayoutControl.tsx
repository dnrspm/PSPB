import { FlaskConical } from "lucide-react";
import { VERVAL_LAYOUTS, setVervalLayout, useVervalLayout, type VervalLayout } from "../../lib/vervalLayout";

/** Kontrol prototipe: pilih penempatan verval dampak di dasbor operasional (hanya untuk demo). */
export function VervalLayoutControl() {
  const layout = useVervalLayout();
  const aktif = VERVAL_LAYOUTS.find((l) => l.value === layout);
  return (
    <div className="border-b border-violet-200 bg-violet-50">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700">
          <FlaskConical className="h-3.5 w-3.5" />
          Kontrol prototipe · Penempatan Verval Dampak
        </span>
        <select
          value={layout}
          onChange={(e) => setVervalLayout(e.target.value as VervalLayout)}
          aria-label="Opsi penempatan verval dampak"
          className="rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
        >
          {VERVAL_LAYOUTS.map((l, i) => (
            <option key={l.value} value={l.value}>
              {i + 1}. {l.label}
            </option>
          ))}
        </select>
        {aktif && (
          <span className="text-xs text-violet-600">
            <strong className="font-semibold">Opsi {VERVAL_LAYOUTS.indexOf(aktif) + 1}:</strong> {aktif.hint}
          </span>
        )}
      </div>
    </div>
  );
}
