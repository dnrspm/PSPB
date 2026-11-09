import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Info, Search } from "lucide-react";
import { useContributionsSync } from "../lib/useContributions";
import { PratinjauDasborPublik } from "../components/workspace/PratinjauDasborPublik";
import { punyaMenuVerval, useVervalLayout } from "../lib/vervalLayout";
import type { SessionUser } from "../lib/auth";
import type { VervalKeputusan, VervalStatus } from "../types/contribution";
import {
  bangunAntrean,
  bolehVerval,
  formatAngka,
  formatWaktuVerval,
  hitungMenunggu,
  setujuiMassal,
  splitWilayah,
  teksField,
  unitKerjaOf,
  type AntreanItem,
  type DampakKey,
} from "../lib/verval";
import { VervalStatusBadge } from "../components/workspace/VervalStatusBadge";
import { RiwayatVervalModal, VervalDampakModal } from "../components/modals/VervalDampakModal";

type FilterStatus = "semua" | VervalStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Perlu Ditinjau" },
  { key: "disetujui", label: "Disetujui" },
  { key: "disetujui-revisi", label: "Disetujui dengan Revisi" },
  { key: "tidak-relevan", label: "Tidak Relevan" },
];

const PAGE_SIZE = 10;

const TH = "bg-[#F1F1F1] px-4 py-3 text-left text-[12px] font-semibold uppercase leading-4 tracking-wide text-[#323232]";

function formatTanggal(date?: Date): string {
  if (!date) return "–";
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** Sel angka/wilayah; nilai yang direvisi ditandai dan menampilkan nilai semula. */
function SelNilai({ item, field }: { item: AntreanItem; field: DampakKey }) {
  const semula = item.verval.nilaiSemula;
  const direvisi = !!semula && Object.prototype.hasOwnProperty.call(semula, field);
  if (field === "wilayah") {
    const daftar = splitWilayah(item.dampak.wilayah || "");
    const ringkas = daftar.slice(0, 2).join(", ");
    return (
      <div title={daftar.join(", ")} className="max-w-[220px]">
        <div className={`text-[15px] leading-[22px] ${direvisi ? "font-semibold text-sky-800" : "text-gray-900"}`}>
          {daftar.length === 0 ? "–" : ringkas}
          {daftar.length > 2 && <span className="text-gray-600"> +{daftar.length - 2} lainnya</span>}
        </div>
        {direvisi && <div className="text-[12px] leading-4 text-gray-600">semula {(semula!.wilayah as string) || "–"}</div>}
      </div>
    );
  }
  return (
    <div className="text-right">
      <div className={`text-[15px] leading-[22px] ${direvisi ? "font-semibold text-sky-800" : "text-gray-900"}`}>
        {teksField(item.dampak, field)}
      </div>
      {direvisi && <div className="text-[12px] leading-4 text-gray-600">semula {formatAngka(semula![field] as number | undefined)}</div>}
    </div>
  );
}

export default function VervalDampakPage() {
  useContributionsSync();
  const layout = useVervalLayout();
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<{ currentUser: SessionUser }>();
  const boleh = bolehVerval(currentUser.role);

  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dipilih, setDipilih] = useState<Record<string, true>>({});
  const [modal, setModal] = useState<{ key: string; keputusan: VervalKeputusan } | null>(null);
  const [riwayat, setRiwayat] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const antrean = bangunAntrean();
  const menunggu = hitungMenunggu(antrean);
  const daftarTab = antrean;

  const jumlahPerStatus = useMemo(() => {
    const n: Record<FilterStatus, number> = { semua: 0, menunggu: 0, disetujui: 0, "disetujui-revisi": 0, "tidak-relevan": 0 };
    for (const i of daftarTab) {
      n[i.verval.status] += 1;
      // Data tidak relevan tidak ikut hitungan Semua
      if (i.verval.status !== "tidak-relevan") n.semua += 1;
    }
    return n;
  }, [daftarTab]);

  const term = search.trim().toLowerCase();
  const baris = daftarTab
    .filter((i) => {
      if (filter === "semua" ? i.verval.status === "tidak-relevan" : i.verval.status !== filter) return false;
      if (!term) return true;
      const c = i.contribution;
      return [c.namaMitra, c.instansi, c.program, c.paketBantuan, unitKerjaOf(c)].some((s) => (s || "").toLowerCase().includes(term));
    })
    // Yang menunggu verval selalu di atas, lalu yang terbaru diperbarui
    .sort((a, b) => {
      const pa = a.verval.status === "menunggu" ? 0 : 1;
      const pb = b.verval.status === "menunggu" ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return new Date(b.verval.diperbaruiPada).getTime() - new Date(a.verval.diperbaruiPada).getTime();
    });

  const totalHalaman = Math.max(1, Math.ceil(baris.length / PAGE_SIZE));
  const halaman = Math.min(page, totalHalaman);
  const tampil = baris.slice((halaman - 1) * PAGE_SIZE, halaman * PAGE_SIZE);

  const bisaDipilih = baris.filter((i) => i.verval.status === "menunggu").map((i) => i.key);
  const semuaDipilih = bisaDipilih.length > 0 && bisaDipilih.every((k) => dipilih[k]);
  const jumlahDipilih = Object.keys(dipilih).filter((k) => daftarTab.some((i) => i.key === k && i.verval.status === "menunggu")).length;

  const modalItem = modal ? antrean.find((i) => i.key === modal.key) : undefined;
  const riwayatItem = riwayat ? antrean.find((i) => i.key === riwayat) : undefined;

  const toggleSemua = () => {
    const next = { ...dipilih };
    for (const k of bisaDipilih) {
      if (semuaDipilih) delete next[k];
      else next[k] = true;
    }
    setDipilih(next);
  };

  const setujuiTerpilih = () => {
    const keys = Object.keys(dipilih);
    const berhasil = setujuiMassal(keys, currentUser.name);
    setDipilih({});
    setToast(`${berhasil.toLocaleString("id-ID")} data dampak disetujui.`);
  };

  const kolomNilai: { key: DampakKey; label: string }[] = [
    { key: "siswa", label: "Realisasi Siswa Terdampak" },
    { key: "guru", label: "Realisasi Guru Terdampak" },
    { key: "satuanPendidikan", label: "Realisasi Satuan Pendidikan Terdampak" },
    { key: "bantuan", label: "Realisasi Satuan Pendidikan Penerima Bantuan" },
    { key: "wilayah", label: "Realisasi Kabupaten/Kota yang Dibantu" },
  ];

  // Hanya dipakai pada opsi dengan menu Verval Dampak
  if (!punyaMenuVerval(layout)) return <Navigate to="/workspace" replace />;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-screen-2xl space-y-5 p-6">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 text-gray-900">Verval Dampak</h1>
          <p className="mt-1 max-w-3xl text-[15px] leading-[22px] text-gray-600">
            Periksa realisasi dampak dari log penyaluran yang diajukan, lalu setujui, setujui dengan revisi, atau tandai tidak relevan.
            Keputusan di halaman ini langsung tercatat di tab Pelaksanaan pada detail kontribusi.
          </p>
        </div>

        {/* Pratinjau dasbor publik: tujuan verval adalah memperbarui angka dampak di web publik */}
        <PratinjauDasborPublik />

        {!boleh && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] leading-5 text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Hanya Biro Kerja Sama yang bisa meninjau dampak. Peran Anda dapat melihat daftar dan riwayat tinjauan.</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
          <h2 className="text-[15px] font-semibold leading-[22px] text-gray-900">Realisasi Dampak</h2>
          {menunggu.total > 0 && (
            <span className="rounded-full bg-amber-100 px-2 text-[12px] font-semibold leading-5 text-amber-800" title="Perlu ditinjau">
              {menunggu.total}
            </span>
          )}
        </div>

        {/* Filter status + pencarian */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const aktif = filter === f.key;
              return (
                <button
                  key={f.key}
                  aria-pressed={aktif}
                  onClick={() => {
                    setFilter(f.key);
                    setPage(1);
                    setDipilih({});
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] font-semibold leading-5 transition-colors ${
                    aktif ? "border-blue-700 bg-blue-700 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-[12px] leading-4 ${aktif ? "bg-white/20" : "bg-gray-100"}`}>
                    {jumlahPerStatus[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full min-w-48 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari instansi, paket, atau unit kerja"
              aria-label="Cari data dampak"
              className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-[15px] leading-[22px] outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        {boleh && jumlahDipilih > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
            <span className="text-[15px] font-semibold leading-[22px] text-blue-900">{jumlahDipilih} data dipilih</span>
            <div className="flex gap-2">
              <button onClick={() => setDipilih({})} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[15px] font-semibold text-gray-700 hover:bg-gray-50">
                Batalkan pilihan
              </button>
              <button onClick={setujuiTerpilih} className="rounded-md bg-blue-600 px-3 py-1.5 text-[15px] font-semibold text-white hover:bg-blue-700">
                Setujui terpilih
              </button>
            </div>
          </div>
        )}

        {/* Tabel */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }} aria-label="Daftar realisasi dampak">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className={`${TH} min-w-[260px]`}>
                    <div className="flex items-center gap-3">
                      {boleh && (
                        <input
                          type="checkbox"
                          aria-label="Pilih semua data yang menunggu tinjauan"
                          checked={semuaDipilih}
                          disabled={bisaDipilih.length === 0}
                          onChange={toggleSemua}
                          className="h-4 w-4 accent-blue-600"
                        />
                      )}
                      Nama Instansi
                    </div>
                  </th>
                  <th className={`${TH} min-w-[200px]`}>Paket Dukungan</th>
                  <th className={`${TH} min-w-[130px]`}>Unit Kerja</th>
                  <th className={`${TH} min-w-[220px]`}>Log Penyaluran</th>
                  {kolomNilai.map((k) => (
                    <th key={k.key} className={`${TH} ${k.key === "wilayah" ? "min-w-[200px]" : "min-w-[120px] text-right"}`}>
                      {k.label}
                    </th>
                  ))}
                  <th className={`${TH} min-w-[190px]`}>Status</th>
                  <th className={`${TH} min-w-[210px]`}>Terakhir Diperbarui</th>
                  <th className={`${TH} sticky right-0 min-w-[260px] shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tampil.map((i) => {
                  const c = i.contribution;
                  const pending = i.verval.status === "menunggu";
                  return (
                    <tr key={i.key} className={dipilih[i.key] ? "bg-blue-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          {boleh && (
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${c.namaMitra}`}
                              checked={!!dipilih[i.key]}
                              disabled={!pending}
                              onChange={() =>
                                setDipilih((prev) => {
                                  const next = { ...prev };
                                  if (next[i.key]) delete next[i.key];
                                  else next[i.key] = true;
                                  return next;
                                })
                              }
                              className="mt-1 h-4 w-4 accent-blue-600 disabled:opacity-30"
                            />
                          )}
                          <button
                            onClick={() => navigate(`/workspace/${c.id}`, { state: { tab: "pelaksanaan" } })}
                            className="text-left text-[15px] font-semibold leading-[22px] text-blue-700 hover:underline"
                          >
                            {c.namaMitra}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-[15px] leading-[22px] text-gray-900">
                        <div>{c.program}</div>
                        <div className="text-[13px] leading-5 text-gray-600">{c.paketBantuan}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-[15px] leading-[22px] text-gray-900">{unitKerjaOf(c)}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-[15px] leading-[22px] text-gray-900">
                          {i.logId ? i.logJudul : i.jumlahLog ? `Total dari ${i.jumlahLog.toLocaleString("id-ID")} log penyaluran` : "Total realisasi kontribusi"}
                        </div>
                        <div className="text-[13px] leading-5 text-gray-600">
                          {i.logId ? "Tanggal kejadian" : "Kontribusi selesai"}: {formatTanggal(i.logTanggal)}
                        </div>
                        {i.logDokumen && <div className="truncate text-[13px] leading-5 text-gray-600" title={i.logDokumen}>{i.logDokumen}</div>}
                      </td>
                      {kolomNilai.map((k) => (
                        <td key={k.key} className="px-4 py-3 align-top">
                          <SelNilai item={i} field={k.key} />
                        </td>
                      ))}
                      <td className="px-4 py-3 align-top">
                        <VervalStatusBadge status={i.verval.status} />
                        {i.verval.catatan && !pending && (
                          <div className="mt-1 max-w-[200px] truncate text-[12px] leading-4 text-gray-600" title={i.verval.catatan}>
                            {i.verval.catatan}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-[15px] font-semibold leading-[22px] text-gray-900">{i.verval.diperbaruiOleh}</div>
                        <div className="text-[13px] leading-5 text-gray-600">{formatWaktuVerval(i.verval.diperbaruiPada)}</div>
                      </td>
                      <td className="sticky right-0 bg-white px-4 py-3 align-top shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
                        <div className="flex flex-wrap items-center gap-2">
                          {pending && boleh ? (
                            <>
                              <button onClick={() => setModal({ key: i.key, keputusan: "setuju" })} className="rounded-md bg-blue-600 px-2.5 py-1 text-[13px] font-semibold leading-5 text-white hover:bg-blue-700">
                                Setuju
                              </button>
                              <button onClick={() => setModal({ key: i.key, keputusan: "revisi" })} className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[13px] font-semibold leading-5 text-gray-700 hover:bg-gray-50">
                                Revisi
                              </button>
                              <button onClick={() => setModal({ key: i.key, keputusan: "tidak-relevan" })} className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-[13px] font-semibold leading-5 text-red-700 hover:bg-red-50">
                                Tidak relevan
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setRiwayat(i.key)} className="text-[13px] font-semibold leading-5 text-blue-700 hover:underline">
                              Lihat riwayat
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {baris.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-[15px] font-semibold leading-[22px] text-gray-900">
                {term ? "Data Tidak Ditemukan" : "Belum Ada Data"}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-gray-600">
                {term
                  ? `Tidak ada data yang cocok dengan "${search.trim()}". Coba kata kunci lain atau hapus pencarian.`
                  : filter === "menunggu"
                  ? "Semua data sudah diverval. Data baru akan muncul di sini setelah diajukan lewat Lanjut Pelaksanaan atau Update Progress."
                  : "Belum ada data dengan status ini. Pilih status lain untuk melihat data lainnya."}
              </p>
            </div>
          )}

          {baris.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3">
              <span className="text-[13px] leading-5 text-gray-600">
                {(halaman - 1) * PAGE_SIZE + 1}–{Math.min(halaman * PAGE_SIZE, baris.length)} dari {baris.length} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, halaman - 1))}
                  disabled={halaman === 1}
                  aria-label="Halaman sebelumnya"
                  className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-[13px] leading-5 text-gray-700">
                  {halaman} / {totalHalaman}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalHalaman, halaman + 1))}
                  disabled={halaman === totalHalaman}
                  aria-label="Halaman berikutnya"
                  className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[13px] leading-5 text-gray-600">
          Data yang menunggu verval selalu tampil paling atas. Data tidak relevan tidak ditampilkan di daftar Semua dan di detail kontribusi;
          arsipnya hanya bisa dibuka lewat filter Tidak Relevan. Klik nama instansi untuk membuka tab Pelaksanaan.
        </p>
      </div>

      {modal && modalItem && (
        <VervalDampakModal
          item={modalItem}
          keputusanAwal={modal.keputusan}
          oleh={currentUser.name}
          onClose={() => setModal(null)}
          onDone={(pesan) => {
            setModal(null);
            setToast(pesan);
          }}
        />
      )}
      {riwayatItem && <RiwayatVervalModal item={riwayatItem} onClose={() => setRiwayat(null)} />}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-[15px] leading-[22px] text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
