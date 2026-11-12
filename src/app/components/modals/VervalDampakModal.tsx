import { useState, type KeyboardEvent } from "react";
import { X, AlertTriangle, ChevronDown } from "lucide-react";
import type { DampakPelaksanaan, VervalKeputusan } from "../../types/contribution";
import {
  DAMPAK_FIELDS,
  VERVAL_KEPUTUSAN_LABELS,
  formatWaktuVerval,
  teksField,
  terapkanVerval,
  unitKerjaOf,
  type AntreanItem,
} from "../../lib/verval";
import { groupWilayah } from "../../lib/dampak";
import { punyaPenerimaBantuan, useVervalLayout } from "../../lib/vervalLayout";
import { PROVINSI_OPTIONS, KABUPATEN_BY_PROVINSI } from "../../data/regionData";
import { WilayahPickerPanel, type WilayahRow } from "./KabupatenMultiSelect";

const baku = (t: string) => t.trim().toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/, "");
const kunciRow = (r: WilayahRow) => `${r.provinsi}|${r.kabupaten}`;

/** Uraikan "Kab (Prov), Kab (Prov)" menjadi baris pemilih wilayah. Entri yang tidak dikenali disimpan apa adanya. */
function uraikanWilayah(w: string): { rows: WilayahRow[]; sisa: string[]; asal: Record<string, string> } {
  const rows: WilayahRow[] = [];
  const sisa: string[] = [];
  const asal: Record<string, string> = {};
  for (const m of w.matchAll(/([^,()]+?)\s*\(([^()]+)\)/g)) {
    const kabLabel = m[1].trim();
    const provLabel = m[2].trim();
    const prov = PROVINSI_OPTIONS.find((o) => baku(o.label) === baku(provLabel));
    const kab = prov && (KABUPATEN_BY_PROVINSI[prov.value] || []).find((o) => baku(o.label) === baku(kabLabel));
    if (prov && kab) {
      const row = { provinsi: prov.value, kabupaten: kab.value };
      if (!rows.some((r) => kunciRow(r) === kunciRow(row))) {
        rows.push(row);
        // Pertahankan penulisan asli (mis. "Kota Bekasi") selama baris masih dipilih
        asal[kunciRow(row)] = `${kabLabel} (${provLabel})`;
      }
    } else sisa.push(`${kabLabel} (${provLabel})`);
  }
  if (rows.length === 0 && sisa.length === 0 && w.trim()) sisa.push(...w.split(",").map((x) => x.trim()).filter(Boolean));
  return { rows, sisa, asal };
}

interface VervalDampakModalProps {
  item: AntreanItem;
  /** Keputusan yang sudah terpilih saat modal dibuka. Kosong: pengguna memilih sendiri. */
  keputusanAwal?: VervalKeputusan;
  /** Nama verifikator yang sedang masuk. */
  oleh: string;
  onClose: () => void;
  /** Dipanggil setelah keputusan tersimpan, dengan pesan untuk toast. */
  onDone: (pesan: string) => void;
  /** Tampilkan ringkasan instansi, paket, dan unit kerja. Matikan bila dibuka dari halaman detail kontribusi yang sama. */
  tampilkanKonteks?: boolean;
}

const KEPUTUSAN: VervalKeputusan[] = ["setuju", "revisi", "tidak-relevan"];

function awalEdit(d: DampakPelaksanaan): Record<string, string> {
  return {
    siswa: String(d.siswa ?? ""),
    guru: String(d.guru ?? ""),
    satuanPendidikan: String(d.satuanPendidikan ?? ""),
    bantuan: d.bantuan === undefined ? "" : String(d.bantuan),
    wilayah: d.wilayah || "",
  };
}

/** Daftar kab/kota dikelompokkan menurut provinsi. */
export function WilayahPerProvinsi({ wilayah }: { wilayah?: string }) {
  if (!wilayah) return <div className="text-[14px] leading-6 text-gray-900">–</div>;
  const { groups, lainnya } = groupWilayah(wilayah);
  const singkat = (n: string) => n.replace(/^Kabupaten\s+/i, "Kab. ");
  return (
    <div className="space-y-1.5 text-[14px] leading-6 text-gray-900">
      {groups.map((g) => (
        <div key={g.provinsi}>
          <p className="text-[12px] font-semibold leading-5 text-gray-600">
            {g.provinsi} <span className="text-[12px] font-normal leading-5">({g.kabupaten.length})</span>
          </p>
          <ul>
            {g.kabupaten.map((k) => (
              <li key={k}>{singkat(k)}</li>
            ))}
          </ul>
        </div>
      ))}
      {lainnya.length > 0 && (
        <ul>
          {lainnya.map((k) => (
            <li key={k}>{singkat(k)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VervalDampakModal({ item, keputusanAwal, oleh, onClose, onDone, tampilkanKonteks = true }: VervalDampakModalProps) {
  const { contribution: c, dampak, verval } = item;
  const adaBantuan = punyaPenerimaBantuan(useVervalLayout());
  const fields = DAMPAK_FIELDS.filter((f) => adaBantuan || f.key !== "bantuan");
  const [keputusan, setKeputusan] = useState<VervalKeputusan | null>(keputusanAwal ?? null);
  const [edits, setEdits] = useState<Record<string, string>>(() => awalEdit(dampak));
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [wilayahBuka, setWilayahBuka] = useState(false);
  const [pemilihBuka, setPemilihBuka] = useState(false);
  const [awalWilayah] = useState(() => uraikanWilayah(dampak.wilayah || ""));
  const [wilayahRows, setWilayahRows] = useState<WilayahRow[]>(awalWilayah.rows);

  const wajibCatatan = keputusan !== "setuju";

  const konfirmasi = () => {
    if (!keputusan) return;
    let nilaiRevisi: DampakPelaksanaan | undefined;
    if (keputusan === "revisi") {
      const angka = (k: string) => (edits[k].trim() === "" ? undefined : Number(edits[k]));
      nilaiRevisi = {
        siswa: angka("siswa") as number,
        guru: angka("guru") as number,
        satuanPendidikan: angka("satuanPendidikan") as number,
        bantuan: angka("bantuan"),
        wilayah: edits.wilayah,
      };
    }
    const hasil = terapkanVerval({
      contributionId: c.id,
      logId: item.logId,
      jenis: item.jenis,
      keputusan,
      catatan,
      nilaiRevisi,
      oleh,
    });
    if (!hasil.ok) {
      setError(hasil.error);
      return;
    }
    onDone(hasil.pesan);
  };

  const konteks: { label: string; value: string }[] = [
    { label: "Nama instansi", value: c.namaMitra },
    { label: "Paket dukungan", value: `${c.program}: ${c.paketBantuan}` },
    { label: "Unit kerja", value: unitKerjaOf(c) },
    { label: "Diajukan oleh", value: `${verval.diajukanOleh}, ${formatWaktuVerval(verval.diajukanPada)}` },
    item.jenis === "target"
      ? { label: "Cakupan", value: "Target dampak kontribusi, diajukan saat Lanjut Pelaksanaan" }
      : item.logId
      ? { label: "Log penyaluran", value: item.logJudul || "-" }
      : { label: "Cakupan", value: item.jumlahLog ? `Total realisasi dari ${item.jumlahLog.toLocaleString("id-ID")} log penyaluran` : "Total realisasi kontribusi" },
    ...(item.logDokumen ? [{ label: "Dokumen pendukung", value: item.logDokumen }] : []),
  ];

  const revisi = keputusan === "revisi";
  const teksWilayah = (rows: WilayahRow[]) =>
    [
      ...rows.map((r) => {
        const prov = PROVINSI_OPTIONS.find((o) => o.value === r.provinsi)?.label || r.provinsi;
        const kab = (KABUPATEN_BY_PROVINSI[r.provinsi] || []).find((o) => o.value === r.kabupaten)?.label || r.kabupaten;
        return awalWilayah.asal[kunciRow(r)] ?? `${kab} (${prov})`;
      }),
      ...awalWilayah.sisa,
    ].join(", ");
  // Saat yang ditinjau adalah target dampak itu sendiri, tidak ada pembanding target dan selisih
  const adalahTarget = item.jenis === "target";
  const target = adalahTarget ? undefined : c.pelaksanaan?.targetDampak;
  // Kab/Kota ditampilkan sebagai jumlah; daftar lengkap dibuka lewat "Lihat semua"
  const teksSel = (d: DampakPelaksanaan | undefined, key: (typeof DAMPAK_FIELDS)[number]["key"]) => {
    if (!d) return "–";
    if (key !== "wilayah") return teksField(d, key);
    const n = d.wilayah ? groupWilayah(d.wilayah).totalKabupaten : 0;
    return n > 0 ? n.toLocaleString("id-ID") : "–";
  };
  const bisaBuka = (f: (typeof DAMPAK_FIELDS)[number]) => !f.angka && !!(dampak.wilayah || target?.wilayah);
  const kolom = adalahTarget
    ? revisi ? "grid-cols-[1fr_9rem_1fr]" : "grid-cols-[1fr_9rem]"
    : revisi ? "grid-cols-[1fr_7rem_8rem_1fr]" : "grid-cols-[1fr_7rem_8rem]";
  // Nilai numerik per field (Kab/Kota dihitung dari jumlahnya) untuk selisih terhadap target
  const angkaDari = (d: DampakPelaksanaan | undefined, key: (typeof DAMPAK_FIELDS)[number]["key"]): number | undefined => {
    if (!d) return undefined;
    if (key === "wilayah") return d.wilayah ? groupWilayah(d.wilayah).totalKabupaten : undefined;
    return d[key] as number | undefined;
  };
  const selisihDari = (key: (typeof DAMPAK_FIELDS)[number]["key"]) => {
    const r = angkaDari(dampak, key);
    const t = angkaDari(target, key);
    if (r === undefined || t === undefined) return null;
    return r - t;
  };

  if (pemilihBuka) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
        <div role="dialog" aria-modal="true" aria-label="Pilih kabupaten/kota" className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
          <WilayahPickerPanel
            initial={wilayahRows}
            onCancel={() => setPemilihBuka(false)}
            onApply={(rows) => {
              setWilayahRows(rows);
              setEdits((prev) => ({ ...prev, wilayah: teksWilayah(rows) }));
              setPemilihBuka(false);
              setError("");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tinjauan realisasi dampak"
        className={`flex max-h-[88vh] w-full flex-col rounded-xl bg-white shadow-xl ${revisi ? "max-w-2xl" : "max-w-[35rem]"}`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-[18px] font-semibold leading-6 text-gray-900">
            {adalahTarget ? "Tinjau Target Dampak" : "Tinjau Realisasi Kontribusi"}
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {tampilkanKonteks ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              {konteks.map((k) => (
                <div key={k.label} className={k.label === "Log penyaluran" || k.label === "Paket dukungan" ? "col-span-2" : undefined}>
                  <dt className="text-[13px] leading-5 text-gray-600">{k.label}</dt>
                  <dd className="text-[14px] leading-5 text-gray-900">{k.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[13px] leading-5 text-gray-600">
              Diajukan oleh {verval.diajukanOleh}, {formatWaktuVerval(verval.diajukanPada)}
            </p>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className={`grid gap-3 bg-[#F1F1F1] px-3 py-1.5 text-[13px] font-semibold text-[#323232] ${kolom}`}>
              <div>Data</div>
              {!adalahTarget && <div>Target</div>}
              <div>{adalahTarget ? "Target diajukan" : "Realisasi"}</div>
              {revisi && <div>Hasil revisi</div>}
            </div>
            {fields.map((f) => (
              <div
                key={f.key}
                className={`grid items-start gap-3 border-t border-gray-100 px-3 py-1.5 ${kolom} ${bisaBuka(f) ? "cursor-pointer hover:bg-gray-50" : ""}`}
                {...(bisaBuka(f)
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-expanded": wilayahBuka,
                      "aria-label": `${f.singkat}: ${wilayahBuka ? "sembunyikan" : "lihat"} daftar kab/kota`,
                      onClick: () => setWilayahBuka((v) => !v),
                      onKeyDown: (e: KeyboardEvent) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setWilayahBuka((v) => !v);
                        }
                      },
                    }
                  : {})}
              >
                <label htmlFor={`rev-${f.key}`} className="text-[14px] leading-6 text-gray-700">
                  {f.singkat}
                </label>
                {!adalahTarget && <div className="flex items-center text-[14px] leading-6 text-gray-900">{teksSel(target, f.key)}</div>}
                <div className="flex items-center gap-2 text-[14px] leading-6 text-gray-900">
                  <div>{teksSel(dampak, f.key)}</div>
                  {(() => {
                    const sel = selisihDari(f.key);
                    if (sel === null) return null;
                    return (
                      <div className={`rounded-full border px-2 text-[12px] font-medium leading-5 ${sel > 0 ? "border-green-200 bg-green-50 text-green-700" : sel < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-600"}`} title="Selisih terhadap target">
                        {sel > 0 ? "+" : sel < 0 ? "−" : ""}
                        {Math.abs(sel).toLocaleString("id-ID")}
                      </div>
                    );
                  })()}
                  {bisaBuka(f) && (
                    <ChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform ${wilayahBuka ? "rotate-180" : ""}`} />
                  )}
                </div>
                {revisi &&
                  (f.angka ? (
                    <input
                      id={`rev-${f.key}`}
                      onClick={(e) => e.stopPropagation()}
                      type="number"
                      min={0}
                      value={edits[f.key]}
                      onChange={(e) => {
                        setEdits((prev) => ({ ...prev, [f.key]: e.target.value }));
                        setError("");
                      }}
                      className="w-full rounded-md border border-gray-300 px-2 py-0.5 text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  ) : (
                    <button
                      id={`rev-${f.key}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPemilihBuka(true);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-left text-[14px] leading-6 hover:border-blue-500"
                    >
                      <span className="text-[14px] leading-6 text-gray-900">
                        {(wilayahRows.length + awalWilayah.sisa.length).toLocaleString("id-ID")} kab/kota
                      </span>
                      <span className="text-[13px] font-medium leading-6 text-blue-600">Ubah</span>
                    </button>
                  ))}
              </div>
            ))}
            {wilayahBuka && (
              <div className={`grid max-h-52 items-start gap-3 overflow-y-auto border-t border-gray-100 bg-gray-50 px-3 py-2 ${kolom}`}>
                <div className="text-[14px] leading-6 text-gray-700">Kab/Kota</div>
                {!adalahTarget && <WilayahPerProvinsi wilayah={target?.wilayah} />}
                <WilayahPerProvinsi wilayah={dampak.wilayah} />
                {revisi && <WilayahPerProvinsi wilayah={edits.wilayah} />}
              </div>
            )}
          </div>

          <fieldset>
            <legend className="mb-1 text-[14px] font-semibold leading-5 text-gray-900">{adalahTarget ? "Verifikasi data target di atas?" : "Verifikasi data realisasi di atas?"}</legend>
            <div className="grid grid-cols-3 gap-2">
              {KEPUTUSAN.map((k) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-center text-[14px] font-semibold leading-5 transition-colors ${
                    keputusan === k ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="keputusan-verval"
                    checked={keputusan === k}
                    onChange={() => {
                      setKeputusan(k);
                      setError("");
                    }}
                    className="sr-only"
                  />
                  {VERVAL_KEPUTUSAN_LABELS[k]}
                </label>
              ))}
            </div>
          </fieldset>

          {keputusan && (
            <div>
              <label htmlFor="catatan-verval" className="mb-1 block text-[14px] font-semibold leading-5 text-gray-900">
                Catatan
                {wajibCatatan ? <span className="ml-0.5 text-red-600">*</span> : <span className="ml-1 font-normal text-gray-600">(opsional)</span>}
              </label>
              <textarea
                id="catatan-verval"
                rows={2}
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  setError("");
                }}
                placeholder="Tulis catatan terkait verifikasi data jika ada"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] leading-5 outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] leading-5 text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {keputusan && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={konfirmasi}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Riwayat verval satu log realisasi, dari pengajuan sampai keputusan terakhir. */
export function RiwayatVervalModal({ item, onClose }: { item: AntreanItem; onClose: () => void }) {
  const judul = item.jenis === "target" ? "Riwayat Tinjauan Target Dampak" : "Riwayat Tinjauan Realisasi Dampak";
  const entri = [...item.verval.riwayat].reverse();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-label={judul} className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-[18px] font-semibold leading-6 text-gray-900">{judul}</h2>
            <p className="text-[13px] leading-5 text-gray-600">
              {item.contribution.namaMitra}
              {item.logJudul ? ` · ${item.logJudul}` : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ol className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {entri.map((e, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  e.jenis === "ajukan" ? "bg-amber-500" : e.jenis === "tidak-relevan" ? "bg-gray-500" : e.jenis === "revisi" ? "bg-sky-500" : "bg-green-600"
                }`}
              />
              <div className="min-w-0">
                <p className="text-[15px] leading-[22px] text-gray-900">{e.text}</p>
                <p className="text-[13px] leading-5 text-gray-600">
                  {e.by}, {formatWaktuVerval(e.at)}
                </p>
                {e.note && (
                  <p className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-[13px] leading-5 text-gray-700">Catatan: {e.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex shrink-0 justify-end border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
