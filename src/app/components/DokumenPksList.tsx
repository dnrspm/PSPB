import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, FileText, Loader2, RotateCcw } from "lucide-react";

export interface DokumenPksItem {
  nama: string;
  oleh: string;
  tanggal: string;
  waktu: string;
  /** Epoch ms; selama belum terlewati, dokumen dianggap masih digenerate sistem. */
  diprosesHingga?: number;
  /** Status eksplisit dari backend; `processing` = masih digenerate, `failed` = generate gagal. */
  status?: "processing" | "failed";
  /** Proses berjalan lebih lama dari biasanya. */
  lambat?: boolean;
}

export const sedangDiproses = (d: DokumenPksItem, now: number) =>
  d.status === "processing" ||
  (d.status !== "failed" && d.diprosesHingga !== undefined && now < d.diprosesHingga);
export const gagal = (d: DokumenPksItem) => d.status === "failed";

function Keterangan({ d, now, muted }: { d: DokumenPksItem; now: number; muted?: boolean }) {
  if (gagal(d))
    return (
      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Dokumen gagal digenerate. Silakan coba lagi.
      </p>
    );
  if (sedangDiproses(d, now))
    return (
      <div className="mt-1" role="status" aria-live="polite">
        <p
          className={`flex items-center gap-1.5 text-xs font-medium ${
            d.lambat ? "text-amber-700" : "text-blue-600"
          }`}
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          {d.lambat ? "Masih diproses, lebih lama dari biasanya" : "Sedang diproses"}
        </p>
        <div
          className={`relative mt-1.5 h-1 w-full overflow-hidden rounded-full ${
            d.lambat ? "bg-amber-100" : "bg-blue-100"
          }`}
        >
          <div
            className={`absolute inset-y-0 w-2/5 rounded-full ${
              d.lambat ? "bg-amber-400" : "bg-blue-500"
            }`}
            style={{ animation: "pks-indeterminate 1.4s ease-in-out infinite" }}
          />
        </div>
        <style>{"@keyframes pks-indeterminate{0%{left:-40%}100%{left:100%}}"}</style>
        <p className="mt-1 text-xs text-gray-500">
          {d.lambat
            ? "Mohon tunggu, dokumen akan muncul setelah selesai."
            : "Dokumen sedang digenerate, mohon tunggu beberapa saat."}
        </p>
      </div>
    );
  return (
    <p className={`mt-0.5 text-xs ${muted ? "text-gray-400" : "text-gray-500"}`}>
      Digenerate oleh {d.oleh} · {d.tanggal} pukul {d.waktu}
    </p>
  );
}

export function useNow(items: DokumenPksItem[]) {
  const [now, setNow] = useState(() => Date.now());
  const deadline = Math.max(0, ...items.map((i) => i.diprosesHingga ?? 0));
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    if (deadline <= t) return;
    const id = setTimeout(() => setNow(Date.now()), deadline - t + 50);
    return () => clearTimeout(id);
  }, [deadline]);
  return now;
}

function LihatButton({
  d,
  now,
  onRetry,
}: {
  d: DokumenPksItem;
  now: number;
  onRetry?: (d: DokumenPksItem) => void;
}) {
  if (gagal(d))
    return (
      <button
        type="button"
        onClick={() => onRetry?.(d)}
        className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        <RotateCcw className="h-3 w-3" />
        Coba lagi
      </button>
    );
  if (sedangDiproses(d, now)) return null;
  return (
    <button
      type="button"
      onClick={() => unduh(d.nama)}
      className="mt-0.5 shrink-0 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      Lihat
    </button>
  );
}

const unduh = (nama: string) => {
  const link = document.createElement("a");
  link.href = "#";
  link.download = nama;
  link.click();
};

/** Daftar dokumen PKS; `items` berurutan dari yang terlama, yang terakhir ditampilkan paling atas dan disorot. */
export function DokumenPksList({
  items,
  onRetry,
}: {
  items: DokumenPksItem[];
  onRetry?: (d: DokumenPksItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const now = useNow(items);
  const ordered = [...items].reverse();
  const [latest, ...older] = ordered;
  if (!latest) return null;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-3.5 ${
          gagal(latest) ? "border-red-200 bg-red-50/50" : "border-blue-100 bg-blue-50/50"
        }`}
      >
        <span
          className={`mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            gagal(latest) ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {gagal(latest) ? "Gagal diproses" : "Terbaru"}
        </span>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {latest.nama}
            </span>
            <Keterangan d={latest} now={now} />
          </div>
          <LihatButton d={latest} now={now} onRetry={onRetry} />
        </div>
      </div>

      {older.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mb-1.5 flex w-full items-center justify-between text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <span>Dokumen sebelumnya ({older.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3.5">
              {older.map((d) => (
                <div key={d.nama} className="flex items-start gap-3 py-2.5">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-900">
                      {d.nama}
                    </span>
                    <Keterangan d={d} now={now} muted />
                  </div>
                  <LihatButton d={d} now={now} onRetry={onRetry} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Badge status segmen Dokumen PKS. Jika `item` (draf PKS Mitra) diberikan, badge
 * belum selesai digenerate, badge tetap menampilkan `labelSebelumnya`.
 */
export function StatusDokumenPksBadge({
  label,
  labelSebelumnya,
  className,
  item,
}: {
  label: string;
  /** Label yang ditampilkan selama `item` masih diproses atau gagal. */
  labelSebelumnya: string;
  className: string;
  item?: DokumenPksItem;
}) {
  const now = useNow(item ? [item] : []);
  // Selama draf belum selesai digenerate (diproses/gagal), status tetap seperti sebelum data diisi.
  const belumSelesai = !!item && (gagal(item) || sedangDiproses(item, now));
  const text = belumSelesai ? labelSebelumnya : label;
  const cls = className;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}
