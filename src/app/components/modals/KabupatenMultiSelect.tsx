import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, MapPin } from "lucide-react";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../../data/regionData";

export interface WilayahRow {
  provinsi: string;
  kabupaten: string;
}

interface KabupatenMultiSelectProps {
  value: WilayahRow[];
  onChange: (rows: WilayahRow[]) => void;
  hasError?: boolean;
}

interface KabupatenIndexItem {
  provinsi: string;
  provinsiLabel: string;
  kabupaten: string;
  kabupatenLabel: string;
  /** Teks pencarian tergabung supaya "bandung jabar" atau nama provinsi ikut cocok. */
  haystack: string;
}

const MAX_RESULTS = 60;

function buildIndex(): KabupatenIndexItem[] {
  const items: KabupatenIndexItem[] = [];
  for (const prov of PROVINSI_OPTIONS) {
    for (const kab of KABUPATEN_BY_PROVINSI[prov.value] || []) {
      items.push({
        provinsi: prov.value,
        provinsiLabel: prov.label,
        kabupaten: kab.value,
        kabupatenLabel: kab.label,
        haystack: `${kab.label} ${prov.label}`.toLowerCase(),
      });
    }
  }
  return items;
}

export function KabupatenMultiSelect({ value, onChange, hasError }: KabupatenMultiSelectProps) {
  const index = useMemo(buildIndex, []);
  const [query, setQuery] = useState("");
  const [provinsiFilter, setProvinsiFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedKeys = useMemo(
    () => new Set(value.map((row) => `${row.provinsi}|${row.kabupaten}`)),
    [value],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    return index.filter((item) => {
      if (provinsiFilter && item.provinsi !== provinsiFilter) return false;
      if (selectedKeys.has(`${item.provinsi}|${item.kabupaten}`)) return false;
      return terms.every((t) => item.haystack.includes(t));
    });
  }, [index, query, provinsiFilter, selectedKeys]);

  const visibleResults = results.slice(0, MAX_RESULTS);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, provinsiFilter]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const add = (item: KabupatenIndexItem) => {
    if (selectedKeys.has(`${item.provinsi}|${item.kabupaten}`)) return;
    onChange([...value, { provinsi: item.provinsi, kabupaten: item.kabupaten }]);
  };

  const remove = (row: WilayahRow) => {
    onChange(value.filter((r) => !(r.provinsi === row.provinsi && r.kabupaten === row.kabupaten)));
  };

  const addAllVisible = () => {
    const additions = results
      .filter((item) => !selectedKeys.has(`${item.provinsi}|${item.kabupaten}`))
      .map((item) => ({ provinsi: item.provinsi, kabupaten: item.kabupaten }));
    if (additions.length === 0) return;
    onChange([...value, ...additions]);
  };

  const removeProvinsi = (provinsi: string) => {
    onChange(value.filter((r) => r.provinsi !== provinsi));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = visibleResults[activeIndex];
      if (item) {
        add(item);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  // Chip dikelompokkan per provinsi mengikuti urutan provinsi pertama kali dipilih.
  const groups = useMemo(() => {
    const map = new Map<string, WilayahRow[]>();
    for (const row of value) {
      const list = map.get(row.provinsi);
      if (list) list.push(row);
      else map.set(row.provinsi, [row]);
    }
    return Array.from(map.entries()).map(([provinsi, rows]) => ({
      provinsi,
      provinsiLabel: PROVINSI_OPTIONS.find((o) => o.value === provinsi)?.label || provinsi,
      rows,
      total: (KABUPATEN_BY_PROVINSI[provinsi] || []).length,
    }));
  }, [value]);

  const labelOf = (row: WilayahRow) =>
    (KABUPATEN_BY_PROVINSI[row.provinsi] || []).find((o) => o.value === row.kabupaten)?.label || row.kabupaten;

  const unselectedInResults = results.filter(
    (item) => !selectedKeys.has(`${item.provinsi}|${item.kabupaten}`),
  ).length;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <select
          value={provinsiFilter}
          onChange={(e) => {
            setProvinsiFilter(e.target.value);
            setOpen(true);
          }}
          className={`w-[38%] shrink-0 rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${provinsiFilter ? "text-gray-900" : "text-gray-400"} ${hasError ? "border-red-300" : "border-gray-200"} [&_option]:text-gray-900`}
        >
          <option value="">Semua provinsi</option>
          {PROVINSI_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Cari kabupaten/kota..."
            className={`w-full rounded-md border py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 placeholder:text-gray-400 ${hasError ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {provinsiFilter && unselectedInResults > 0 && (
            <button
              type="button"
              onClick={addAllVisible}
              className="flex w-full items-center gap-2 border-b border-gray-100 bg-blue-50/60 px-3 py-2 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <Check className="h-3.5 w-3.5" />
              Pilih semua {unselectedInResults} kabupaten/kota
              {query.trim() ? " yang cocok" : ` di ${PROVINSI_OPTIONS.find(o => o.value === provinsiFilter)?.label}`}
            </button>
          )}
          <div ref={listRef} className="max-h-56 overflow-y-auto py-1">
            {visibleResults.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">
                {results.length === 0 && query.trim()
                  ? `Tidak ada hasil untuk "${query.trim()}"`
                  : "Semua kabupaten/kota pada filter ini sudah dipilih"}
              </p>
            ) : (
              visibleResults.map((item, i) => (
                <button
                  key={`${item.provinsi}|${item.kabupaten}`}
                  type="button"
                  data-idx={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    add(item);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${i === activeIndex ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
                >
                  <span className="truncate">{item.kabupatenLabel}</span>
                  <span className="shrink-0 text-xs text-gray-400">{item.provinsiLabel}</span>
                </button>
              ))
            )}
          </div>
          {results.length > MAX_RESULTS && (
            <p className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400">
              Menampilkan {MAX_RESULTS} dari {results.length} hasil — perhalus pencarian.
            </p>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">
              {value.length} kabupaten/kota dipilih di {groups.length} provinsi
            </p>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-gray-400 hover:text-red-500"
            >
              Hapus semua
            </button>
          </div>
          <div className="max-h-44 space-y-2.5 overflow-y-auto">
            {groups.map((group) => {
              const expanded = expandedGroups[group.provinsi] ?? false;
              const shown = expanded ? group.rows : group.rows.slice(0, 8);
              return (
                <div key={group.provinsi}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">
                      {group.provinsiLabel}
                    </span>
                    <span className="text-xs text-gray-400">
                      {group.rows.length}/{group.total}
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
                    {shown.map((row) => (
                      <span
                        key={`${row.provinsi}|${row.kabupaten}`}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white py-0.5 pl-2.5 pr-1 text-xs text-gray-700"
                      >
                        {labelOf(row)}
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          aria-label={`Hapus ${labelOf(row)}`}
                          className="rounded-full p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {group.rows.length > 8 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroups((prev) => ({ ...prev, [group.provinsi]: !expanded }))
                        }
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        {expanded ? "Tampilkan lebih sedikit" : `+${group.rows.length - 8} lainnya`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
