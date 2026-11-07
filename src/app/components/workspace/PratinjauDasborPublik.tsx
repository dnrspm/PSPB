import { useEffect, useState, type ReactNode } from "react";
import { useOutletContext } from "react-router";
import { ArrowDownRight, ArrowUpRight, BookOpen, Building2, CheckCircle2, ChevronDown, Handshake, MapPin, Minus, Send, Users } from "lucide-react";
import { useContributionsSync } from "../../lib/useContributions";
import { publikasikanDampak, usePublikasi, type PublikasiDampak } from "../../lib/publikasiDampak";
import type { SessionUser } from "../../lib/auth";
import {
  ANGKA_PUBLIK_KOSONG,
  BASELINE_DAMPAK,
  PUBLIKASI_AWAL,
  angkaDisetujuiSebelum,
  bangunAntrean,
  bolehVerval,
  formatAngka,
  formatWaktuVerval,
  ringkasanDashboard,
  type AngkaPublik,
} from "../../lib/verval";

type Kunci = keyof AngkaPublik;

/** Sedang Tayang (live): yang tayang sekarang. Setelah Publikasi (pratinjau): angka setelah tambahan yang siap masuk dipublikasikan. */
type Mode = "live" | "pratinjau";
const MODE_LABEL: { key: Mode; label: string }[] = [
  { key: "live", label: "Sedang Tayang" },
  { key: "pratinjau", label: "Setelah Publikasi" },
];

/** Metrik dampak: label, angka, lalu kenaikan dibanding periode sebelumnya. */
function Metrik({ ikon, label, kalimat, angka, kenaikan, kartu = false }: { ikon: ReactNode; label: string; kalimat: string; angka: string; kenaikan: ReactNode; kartu?: boolean }) {
  return (
    <div className={`min-w-0 ${kartu ? "" : "px-3 py-3"}`} title={kalimat}>
      <div className="flex items-center gap-1.5 whitespace-nowrap text-[12px] leading-4 text-gray-600">
        <span className="text-blue-600">{ikon}</span>
        {label}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
        <p className={`font-semibold tabular-nums ${kartu ? "text-[20px] leading-7 text-black" : "text-[24px] leading-8 text-gray-900"}`}>{angka}</p>
      </div>
      <p className="text-[12px] leading-4">{kenaikan}</p>
    </div>
  );
}

const DAFTAR: { key: Kunci; label: string; kalimat: string; ikon: ReactNode }[] = [
  { key: "siswa", label: "Siswa", kalimat: "Siswa telah merasakan manfaat program pendidikan", ikon: <Users className="h-4 w-4" /> },
  { key: "guru", label: "Guru", kalimat: "Guru telah mengikuti pengembangan kompetensi", ikon: <BookOpen className="h-4 w-4" /> },
  { key: "satuanPendidikan", label: "Satuan pendidikan", kalimat: "Satuan pendidikan telah terbantu program kami", ikon: <Building2 className="h-4 w-4" /> },
  { key: "program", label: "Program kolaborasi", kalimat: "Program kolaborasi berjalan dengan sukses", ikon: <CheckCircle2 className="h-4 w-4" /> },
  { key: "daerah", label: "Daerah", kalimat: "Daerah di Indonesia telah terjangkau program kami", ikon: <MapPin className="h-4 w-4" /> },
  { key: "mitra", label: "Mitra", kalimat: "Mitra telah berpartisipasi dalam program", ikon: <Handshake className="h-4 w-4" /> },
];

/** Angka yang tayang, angka draf (seluruh dampak disetujui), dan selisihnya. Dipakai kartu dan penanda di switch. */
function useStatusPublikasi() {
  const publikasi = usePublikasi();
  const antrean = bangunAntrean();
  const draf = ringkasanDashboard(antrean);

  // Publikasi awal data contoh (turunan dari data verval), lalu publikasi yang dilakukan admin
  const waktuAwal = new Date();
  waktuAwal.setDate(waktuAwal.getDate() - PUBLIKASI_AWAL.hariLalu);
  waktuAwal.setHours(9, 0, 0, 0);
  const awal: PublikasiDampak = { id: "pub-awal", at: waktuAwal, oleh: PUBLIKASI_AWAL.oleh, angka: angkaDisetujuiSebelum(antrean, waktuAwal) };
  const riwayat = [awal, ...publikasi];
  const terbit = riwayat[riwayat.length - 1];
  const sebelumnya = riwayat[riwayat.length - 2];
  const tampil = terbit.angka;
  const pembanding = sebelumnya?.angka ?? ANGKA_PUBLIK_KOSONG;

  // Perubahan yang sudah disetujui tetapi belum dipublikasikan
  const belumTerbit = DAFTAR.map((m) => ({ ...m, selisih: draf[m.key] - tampil[m.key] })).filter((m) => m.selisih !== 0);
  return { draf, terbit, sebelumnya, tampil, pembanding, belumTerbit };
}

/** Jumlah angka dampak yang sudah disetujui tetapi belum dipublikasikan. */
export function useJumlahBelumDipublikasikan(): number {
  useContributionsSync();
  return useStatusPublikasi().belumTerbit.length;
}

/** Pratinjau dasbor publik: angka dampak = baseline + realisasi yang sudah diverval, tayang saat dipublikasikan. */
export function PratinjauDasborPublik({ className = "", awalTerbuka = true, bisaDilipat = true, tanpaJudul = false, kartuTerpisah = false }: { className?: string; awalTerbuka?: boolean; bisaDilipat?: boolean; tanpaJudul?: boolean; kartuTerpisah?: boolean }) {
  useContributionsSync();
  const konteks = useOutletContext<{ currentUser: SessionUser } | undefined>();
  const boleh = konteks ? bolehVerval(konteks.currentUser.role) : false;
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<Mode>("live");
  const [terbukaState, setTerbuka] = useState(awalTerbuka);
  const terbuka = bisaDilipat ? terbukaState : true;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const { draf, terbit, sebelumnya, tampil, pembanding, belumTerbit } = useStatusPublikasi();

  // Pembanding dilabeli bulan publikasi sebelumnya; tanpa publikasi sebelumnya (baseline) memakai label tetap data contoh
  const labelPembanding = sebelumnya
    ? sebelumnya.at.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
    : "Nov 2026";

  // Pratinjau visual: angka seandainya Publikasikan diklik, dibandingkan dengan yang sedang tayang
  const ada = belumTerbit.length > 0;
  const pratinjau = ada && mode === "pratinjau";
  const bulanTayang = terbit.at.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  const angkaTampil = pratinjau ? draf : tampil;
  const pembandingTampil = pratinjau ? tampil : pembanding;
  const labelTampil = pratinjau ? bulanTayang : labelPembanding;

  const tinjau = () => {
    setTerbuka(true);
    setMode("pratinjau");
  };

  const publikasikan = () => {
    if (!konteks) return;
    const { siswa, guru, satuanPendidikan, program, daerah, mitra } = draf;
    publikasikanDampak(konteks.currentUser.name, { siswa, guru, satuanPendidikan, program, daerah, mitra });
    setMode("live");
    setToast("Dasbor publik dipublikasikan.");
  };

  /** Kenaikan angka dibanding publikasi sebelumnya (periode = jarak antar publikasi). */
  const kenaikan = (key: Kunci) => {
    const naik = angkaTampil[key] - pembandingTampil[key];
    const warna = naik > 0 ? "text-green-700" : naik < 0 ? "text-red-700" : "text-gray-600";
    const Ikon = naik > 0 ? ArrowUpRight : naik < 0 ? ArrowDownRight : Minus;
    // Selisih berwarna (naik/turun); pembanding "dari Nov 2026" netral
    return (
      <span className="inline-flex items-start gap-0.5">
        <span className={`mt-px shrink-0 ${warna}`}>
          <Ikon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>
          {naik === 0 ? (
            <span className="text-gray-600">Tidak berubah dari {labelTampil}</span>
          ) : (
            <>
              <span className={`font-medium ${warna}`}>
                {naik > 0 ? "Naik" : "Turun"} {formatAngka(Math.abs(naik))}
              </span>{" "}
              <span className="text-gray-600">dari {labelTampil}</span>
            </>
          )}
        </span>
      </span>
    );
  };

  return (
    <section
      aria-label="Dasbor Dampak"
      className={
        kartuTerpisah
          ? `flex flex-col gap-4 ${className}`
          : `flex flex-col rounded-lg border bg-white shadow-sm border-gray-200 ${className}`
      }
    >
      <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${kartuTerpisah ? "" : `px-4 py-3 ${terbuka ? "border-b border-gray-100" : ""}`}`}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {ada && terbuka && (
            <div role="group" aria-label="Tampilan angka" className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
              {MODE_LABEL.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode === m.key}
                  onClick={() => setMode(m.key)}
                  className={`px-3 py-1.5 text-[13px] font-semibold leading-5 transition-colors ${
                    mode === m.key ? "bg-blue-50 text-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${m.key !== "live" ? "border-l border-gray-300" : ""}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
          <div className="min-w-0">
            {!tanpaJudul && (
              <h3 className="text-[15px] font-semibold leading-[22px] text-gray-900">
                Dasbor Dampak
              </h3>
            )}
            <p className={`flex items-center gap-1.5 ${tanpaJudul ? "text-[13px] leading-5 text-gray-700" : "text-[12px] leading-4 text-gray-600"}`}>
              {pratinjau
                ? "Angka setelah dipublikasikan, belum tayang di web publik"
                  : `Dipublikasikan ${formatWaktuVerval(terbit.at)} oleh ${terbit.oleh}`}
              {!terbuka && belumTerbit.length > 0 && (
                <span className="font-semibold text-amber-700"> · {belumTerbit.length} angka belum dipublikasikan</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {belumTerbit.length > 0 &&
            (boleh ? (
              <button
                type="button"
                // Saat tertutup, tombol hanya membuka kartu dengan pratinjau; publikasi dilakukan setelah angkanya ditinjau
                onClick={terbuka ? publikasikan : tinjau}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[13px] font-semibold leading-5 text-white hover:bg-blue-700"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                {terbuka ? "Publikasikan" : "Tinjau publikasi"}
              </button>
            ) : (
              <span className="text-[12px] leading-4 text-gray-600">Dipublikasikan oleh Biro Kerja Sama</span>
            ))}
          {bisaDilipat && (
            <button
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              aria-expanded={terbuka}
              aria-label={terbuka ? "Tutup Dasbor Dampak" : "Buka Dasbor Dampak"}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${terbuka ? "rotate-180" : ""}`} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {terbuka && kartuTerpisah && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {DAFTAR.map((m) => (
            <div
              key={m.key}
              className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm"
            >
              <Metrik
                kartu
                ikon={m.ikon}
                label={m.label}
                kalimat={m.kalimat}
                angka={formatAngka(BASELINE_DAMPAK[m.key] + angkaTampil[m.key])}
                kenaikan={kenaikan(m.key)}
              />
            </div>
          ))}
        </div>
      )}

      {terbuka && !kartuTerpisah && (
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-6">
        {DAFTAR.map((m, i) => (
          <div
            key={m.key}
            className={`${i >= 3 ? "sm:border-t sm:border-gray-100 xl:border-t-0" : ""} ${i % 3 !== 0 ? "sm:border-l sm:border-gray-100" : ""} ${i === 3 ? "xl:border-l xl:border-gray-100" : ""} `}
          >
            <Metrik ikon={m.ikon} label={m.label} kalimat={m.kalimat} angka={formatAngka(BASELINE_DAMPAK[m.key] + angkaTampil[m.key])} kenaikan={kenaikan(m.key)}
            />
          </div>
        ))}
      </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-[15px] leading-[22px] text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span>{toast}</span>
        </div>
      )}
    </section>
  );
}
