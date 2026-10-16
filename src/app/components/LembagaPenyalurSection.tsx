import { Truck } from "lucide-react";
import type { Contribution } from "../types/contribution";

/** Kartu "Lembaga Penyalur"; tampil bila mitra memilih menggunakan lembaga penyalur pada Data PKS Mitra. */
export function LembagaPenyalurSection({
  c,
  className = "p-5",
}: {
  c: Contribution;
  className?: string;
}) {
  const fields =
    [...c.aktivitas].reverse().find((a) => a.action === "Isi Data PKS Mitra")
      ?.fields ?? {};
  if (fields["Menggunakan lembaga penyalur?"] !== "Ya") return null;

  const items: [string, string, boolean?][] = [
    ["Nama Lembaga Penyalur", fields["Nama lembaga penyalur"]],
    ["PIC Penyaluran", fields["PIC penyaluran"]],
    ["Profil & Legalitas", fields["Profil & legalitas penyalur"], true],
  ];

  return (
    <div
      className={`rounded-lg border border-gray-100 bg-white shadow-sm ${className}`}
    >
      <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-gray-400">
        <Truck className="h-4 w-4" /> Lembaga Penyalur
      </h3>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {items.map(([label, value, full]) => (
          <div key={label} className={full ? "sm:col-span-2" : undefined}>
            <dt className="text-gray-400">{label}</dt>
            <dd className="whitespace-pre-line text-gray-900">{value || "-"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
