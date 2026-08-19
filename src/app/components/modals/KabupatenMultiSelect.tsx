import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../../data/regionData";

export interface WilayahRow {
  provinsi: string;
  kabupaten: string;
}

interface KabupatenMultiSelectProps {
  value: WilayahRow[];
  onChange: (rows: WilayahRow[]) => void;
  /** Membuka panel wilayah di dalam modal aksi. */
  onOpenPicker: () => void;
  hasError?: boolean;
}

const keyOf = (provinsi: string, kabupaten: string) => `${provinsi}|${kabupaten}`;
const provLabel = (value: string) => PROVINSI_OPTIONS.find((o) => o.value === value)?.label || value;
const kabLabel = (provinsi: string, kabupaten: string) =>
  (KABUPATEN_BY_PROVINSI[provinsi] || []).find((o) => o.value === kabupaten)?.label || kabupaten;

/** Kelompokkan pilihan per provinsi, urut sesuai daftar provinsi nasional. */
function groupByProvinsi(value: WilayahRow[]) {
  const map = new Map<string, string[]>();
  for (const row of value) {
    const list = map.get(row.provinsi);
    if (list) list.push(row.kabupaten);
    else map.set(row.provinsi, [row.kabupaten]);
  }
  return PROVINSI_OPTIONS.filter((p) => map.has(p.value)).map((p) => ({
    provinsi: p.value,
    provinsiLabel: p.label,
    kabupaten: map.get(p.value) || [],
    total: (KABUPATEN_BY_PROVINSI[p.value] || []).length,
  }));
}

/** Panel wilayah menggantikan isi modal aksi (tanpa overlay bertumpuk). */
export function WilayahPickerPanel({
  initial,
  onCancel,
  onApply,
}: {
  initial: WilayahRow[];
  onCancel: () => void;
  onApply: (rows: WilayahRow[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.map((r) => keyOf(r.provinsi, r.kabupaten))),
  );
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initial.map((r) => r.provinsi)),
  );

  const q = query.trim().toLowerCase();

  /** Saat mencari, hanya provinsi/kab yang cocok yang ditampilkan dan otomatis terbuka. */
  const tree = useMemo(() => {
    return PROVINSI_OPTIONS.map((prov) => {
      const all = KABUPATEN_BY_PROVINSI[prov.value] || [];
      const provMatch = prov.label.toLowerCase().includes(q);
      const kabupaten = !q || provMatch ? all : all.filter((k) => k.label.toLowerCase().includes(q));
      return { ...prov, all, kabupaten };
    }).filter((prov) => !q || prov.kabupaten.length > 0);
  }, [q]);

  const toggleKab = (provinsi: string, kabupaten: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = keyOf(provinsi, kabupaten);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleProvinsi = (provinsi: string, kabupaten: { value: string }[], allSelected: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of kabupaten) {
        const key = keyOf(provinsi, k.value);
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
    setExpanded((prev) => new Set(prev).add(provinsi));
  };

  const toggleExpand = (provinsi: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(provinsi)) next.delete(provinsi);
      else next.add(provinsi);
      return next;
    });
  };

  const selectedRows: WilayahRow[] = useMemo(
    () =>
      PROVINSI_OPTIONS.flatMap((prov) =>
        (KABUPATEN_BY_PROVINSI[prov.value] || [])
          .filter((k) => selected.has(keyOf(prov.value, k.value)))
          .map((k) => ({ provinsi: prov.value, kabupaten: k.value })),
      ),
    [selected],
  );

  const provinsiTerpilih = new Set(selectedRows.map((r) => r.provinsi)).size;

  return (
    <>
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Kembali ke formulir"
          className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800">Pilih Wilayah</h2>
      </div>

      <div className="border-b border-gray-100 px-4 py-3 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kabupaten/kota atau provinsi..."
                className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400"
              />
            </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {tree.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Tidak ada wilayah yang cocok dengan &quot;{query.trim()}&quot;
              </p>
            ) : (
              tree.map((prov) => {
                const selectedCount = prov.all.filter((k) =>
                  selected.has(keyOf(prov.value, k.value)),
                ).length;
                const shownSelected = prov.kabupaten.filter((k) =>
                  selected.has(keyOf(prov.value, k.value)),
                ).length;
                const allShownSelected =
                  prov.kabupaten.length > 0 && shownSelected === prov.kabupaten.length;
                const partial = shownSelected > 0 && !allShownSelected;
                const isOpen = q ? true : expanded.has(prov.value);

                return (
                  <div key={prov.value} className="border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-2 py-2">
                      <button
                        type="button"
                        onClick={() => toggleProvinsi(prov.value, prov.kabupaten, allShownSelected)}
                        aria-label={`Pilih semua kabupaten/kota di ${prov.label}`}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          allShownSelected
                            ? "border-blue-600 bg-blue-600"
                            : partial
                              ? "border-blue-600 bg-white"
                              : "border-gray-300 bg-white"
                        }`}
                      >
                        {allShownSelected && <Check className="h-3 w-3 text-white" />}
                        {partial && <span className="h-0.5 w-2 rounded bg-blue-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(prov.value)}
                        className="flex flex-1 items-center gap-1.5 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{prov.label}</span>
                        <span className="text-xs text-gray-400">
                          {selectedCount > 0 ? `${selectedCount}/${prov.all.length}` : prov.all.length}
                        </span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pb-2 pl-6">
                        {prov.kabupaten.map((k) => {
                          const checked = selected.has(keyOf(prov.value, k.value));
                          return (
                            <label
                              key={k.value}
                              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleKab(prov.value, k.value)}
                                className="sr-only"
                              />
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}
                              >
                                {checked && <Check className="h-3 w-3 text-white" />}
                              </span>
                              <span className="truncate">{k.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>
                {selectedRows.length} kabupaten/kota di {provinsiTerpilih} provinsi
              </span>
              {selectedRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs font-medium text-gray-400 hover:text-red-500"
                >
                  Hapus semua
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => onApply(selectedRows)}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Simpan Pilihan
              </button>
            </div>
      </div>
    </>
  );
}

export function KabupatenMultiSelect({ value, onChange, onOpenPicker, hasError }: KabupatenMultiSelectProps) {
  const groups = useMemo(() => groupByProvinsi(value), [value]);

  const removeKabupaten = (provinsi: string, kabupaten: string) =>
    onChange(value.filter((r) => !(r.provinsi === provinsi && r.kabupaten === kabupaten)));

  const removeProvinsi = (provinsi: string) =>
    onChange(value.filter((r) => r.provinsi !== provinsi));

  return (
    <div>
      <button
        type="button"
        onClick={onOpenPicker}
        className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm outline-none hover:border-blue-400 ${hasError ? "border-red-300 bg-red-50/40" : "border-gray-200 bg-white"}`}
      >
        <span className={value.length > 0 ? "text-gray-900" : "text-gray-400"}>
          {value.length > 0
            ? `${value.length} kabupaten/kota di ${groups.length} provinsi`
            : "Pilih kabupaten/kota..."}
        </span>
        <span className="shrink-0 text-xs font-medium text-blue-600">
          {value.length > 0 ? "Ubah" : "Pilih Wilayah"}
        </span>
      </button>

      {groups.length > 0 && (
        <div className="mt-2 max-h-52 space-y-2.5 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2.5">
          {groups.map((group) => (
            <div key={group.provinsi}>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600">{group.provinsiLabel}</span>
                <span className="text-xs text-gray-400">
                  {group.kabupaten.length}/{group.total}
                </span>
                <button
                  type="button"
                  onClick={() => removeProvinsi(group.provinsi)}
                  className="ml-auto text-xs text-gray-400 hover:text-red-500"
                >
                  Hapus
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.kabupaten.map((kab) => {
                  const label = kabLabel(group.provinsi, kab);
                  return (
                    <span
                      key={kab}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white py-0.5 pl-2.5 pr-1 text-xs text-gray-700"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeKabupaten(group.provinsi, kab)}
                        aria-label={`Hapus ${label}`}
                        className="rounded-full p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
