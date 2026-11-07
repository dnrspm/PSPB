import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { DampakPelaksanaan, VervalKeputusan } from "../../types/contribution";
import {
  DAMPAK_FIELDS,
  VERVAL_KEPUTUSAN_DESKRIPSI,
  VERVAL_KEPUTUSAN_LABELS,
  formatWaktuVerval,
  teksField,
  terapkanVerval,
  unitKerjaOf,
  type AntreanItem,
} from "../../lib/verval";

interface VervalDampakModalProps {
  item: AntreanItem;
  keputusanAwal: VervalKeputusan;
  /** Nama verifikator yang sedang masuk. */
  oleh: string;
  onClose: () => void;
  /** Dipanggil setelah keputusan tersimpan, dengan pesan untuk toast. */
  onDone: (pesan: string) => void;
}

const KEPUTUSAN: VervalKeputusan[] = ["setuju", "revisi", "tidak-relevan"];

const TOMBOL: Record<VervalKeputusan, string> = {
  setuju: "Setujui",
  revisi: "Simpan revisi",
  "tidak-relevan": "Tandai tidak relevan",
};

function awalEdit(d: DampakPelaksanaan): Record<string, string> {
  return {
    siswa: String(d.siswa ?? ""),
    guru: String(d.guru ?? ""),
    satuanPendidikan: String(d.satuanPendidikan ?? ""),
    bantuan: d.bantuan === undefined ? "" : String(d.bantuan),
    wilayah: d.wilayah || "",
  };
}

export function VervalDampakModal({ item, keputusanAwal, oleh, onClose, onDone }: VervalDampakModalProps) {
  const { contribution: c, dampak, verval } = item;
  const [keputusan, setKeputusan] = useState<VervalKeputusan>(keputusanAwal);
  const [edits, setEdits] = useState<Record<string, string>>(() => awalEdit(dampak));
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");

  const wajibCatatan = keputusan !== "setuju";

  const konfirmasi = () => {
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
    item.logId
      ? { label: "Log penyaluran", value: item.logJudul || "-" }
      : { label: "Cakupan", value: item.jumlahLog ? `Total realisasi dari ${item.jumlahLog.toLocaleString("id-ID")} log penyaluran` : "Total realisasi kontribusi" },
    ...(item.logDokumen ? [{ label: "Dokumen pendukung", value: item.logDokumen }] : []),
  ];

  const revisi = keputusan === "revisi";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tinjauan realisasi dampak"
        className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[18px] font-semibold leading-6 text-gray-900">
            Tinjauan Realisasi Dampak
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            {konteks.map((k) => (
              <div key={k.label} className={k.label === "Log penyaluran" || k.label === "Paket dukungan" ? "col-span-2" : undefined}>
                <dt className="text-[13px] leading-5 text-gray-600">{k.label}</dt>
                <dd className="text-[15px] leading-[22px] text-gray-900">{k.value}</dd>
              </div>
            ))}
          </dl>

          <fieldset>
            <legend className="mb-2 text-[15px] font-semibold leading-[22px] text-gray-900">Keputusan tinjauan</legend>
            <div className="space-y-2">
              {KEPUTUSAN.map((k) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    keputusan === k ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
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
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />
                  <span>
                    <span className="block text-[15px] font-semibold leading-[22px] text-gray-900">
                      {VERVAL_KEPUTUSAN_LABELS[k]}
                    </span>
                    <span className="block text-[13px] leading-5 text-gray-600">{VERVAL_KEPUTUSAN_DESKRIPSI[k]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="mb-1 text-[15px] font-semibold leading-[22px] text-gray-900">
              Realisasi dampak yang diajukan
            </p>
            {revisi && (
              <p className="mb-2 text-[13px] leading-5 text-gray-600">
                Ubah nilai di kolom hasil revisi. Nilai yang diajukan tetap tersimpan di riwayat verval.
              </p>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className={`grid gap-3 bg-[#F1F1F1] px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-[#323232] ${revisi ? "grid-cols-[1.2fr_1fr_1.2fr]" : "grid-cols-[1.4fr_1fr]"}`}>
                <div>Data</div>
                <div>Nilai diajukan</div>
                {revisi && <div>Nilai hasil revisi</div>}
              </div>
              {DAMPAK_FIELDS.map((f) => (
                <div
                  key={f.key}
                  className={`grid items-start gap-3 border-t border-gray-100 px-3 py-2 ${revisi ? "grid-cols-[1.2fr_1fr_1.2fr]" : "grid-cols-[1.4fr_1fr]"}`}
                >
                  <label htmlFor={`rev-${f.key}`} className="text-[15px] leading-[22px] text-gray-900">
                    {f.label}
                  </label>
                  <div className="break-words text-[15px] leading-[22px] text-gray-900">{teksField(dampak, f.key)}</div>
                  {revisi &&
                    (f.angka ? (
                      <input
                        id={`rev-${f.key}`}
                        type="number"
                        min={0}
                        value={edits[f.key]}
                        onChange={(e) => {
                          setEdits((prev) => ({ ...prev, [f.key]: e.target.value }));
                          setError("");
                        }}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-[15px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      />
                    ) : (
                      <div>
                        <textarea
                          id={`rev-${f.key}`}
                          rows={3}
                          value={edits[f.key]}
                          onChange={(e) => {
                            setEdits((prev) => ({ ...prev, [f.key]: e.target.value }));
                            setError("");
                          }}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-[15px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        />
                        <p className="text-[12px] leading-4 text-gray-600">Pisahkan dengan koma, cth. Kota Bekasi (Jawa Barat)</p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="catatan-verval" className="mb-1 block text-[15px] font-semibold leading-[22px] text-gray-900">
              Catatan verval
              {wajibCatatan ? <span className="ml-0.5 text-red-600">*</span> : <span className="ml-1 font-normal text-gray-600">(opsional)</span>}
            </label>
            <textarea
              id="catatan-verval"
              rows={3}
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setError("");
              }}
              placeholder={
                keputusan === "tidak-relevan"
                  ? "cth. Data tercatat ganda untuk paket yang sama"
                  : keputusan === "revisi"
                  ? "cth. Jumlah siswa disesuaikan dengan data Dapodik"
                  : "cth. Sudah sesuai dengan dokumen pendukung"
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] leading-[22px] outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] leading-5 text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={konfirmasi}
            className={`rounded-md px-3 py-1.5 text-[15px] font-semibold text-white ${
              keputusan === "tidak-relevan" ? "bg-gray-800 hover:bg-gray-900" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {TOMBOL[keputusan]}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Riwayat verval satu log realisasi, dari pengajuan sampai keputusan terakhir. */
export function RiwayatVervalModal({ item, onClose }: { item: AntreanItem; onClose: () => void }) {
  const judul = "Riwayat Tinjauan Realisasi Dampak";
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
