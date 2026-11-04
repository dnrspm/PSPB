import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical } from "lucide-react";
import { PKS_SCENARIOS, setPksScenario, usePksScenario, type PksScenario } from "../lib/pksGenerateScenario";

/** Kontrol prototipe: pilih skenario hasil generate dokumen PKS (hanya untuk demo). */
export function PksScenarioControl() {
  const { scenario } = usePksScenario();
  const active = PKS_SCENARIOS.find((s) => s.value === scenario);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById("prototype-control-slot")), []);
  if (!slot) return null;
  return createPortal(
    <div className="border-b border-violet-200 bg-violet-50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700">
        <FlaskConical className="h-3.5 w-3.5" />
        Kontrol prototipe · Generate Dokumen PKS
      </span>
      <select
        value={scenario}
        onChange={(e) => setPksScenario(e.target.value as PksScenario)}
        aria-label="Skenario generate dokumen PKS"
        className="rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
      >
        {PKS_SCENARIOS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {active && <span className="text-xs text-violet-600">{active.hint}</span>}
      </div>
    </div>,
    slot,
  );
}
