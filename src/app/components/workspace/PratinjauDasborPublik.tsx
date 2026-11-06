import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, BookOpen, Building2, CheckCircle2, Handshake, MapPin, Minus, Users } from "lucide-react";
import { useContributionsSync } from "../../lib/useContributions";
import {
  BASELINE_DAMPAK,
  DASBOR_PUBLIK_LAINNYA,
  bangunAntrean,
  formatAngka,
  formatWaktuVerval,
  hitungMenunggu,
  ringkasanDashboard,
} from "../../lib/verval";

/** Metrik dampak yang dipengaruhi verval: angka besar, penjelasan, lalu kenaikan bulanan. */
function Metrik({
  ikon,
  angka,
  tebal,
  sisa,
  kenaikan,
}: {
  ikon: ReactNode;
  angka: string;
  tebal: string;
  sisa: string;
  kenaikan: ReactNode;
}) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2 text-blue-600">{ikon}</div>
      <p className="mt-2 text-[32px] font-bold leading-10 tracking-tight tabular-nums text-gray-900">{angka}</p>
      <p className="mt-0.5 text-[13px] leading-5 text-gray-600">
        <strong className="font-semibold text-gray-900">{tebal}</strong> {sisa}
      </p>
      <p className="mt-2 text-[13px] leading-5">{kenaikan}</p>
    </div>
  );
}

/** Angka pendukung yang belum terhubung ke data: dibuat lebih redup dari metrik dampak. */
function Pendukung({ ikon, angka, label, catatan }: { ikon: ReactNode; angka: string; label: string; catatan: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 px-4 py-3 sm:px-5">
      <span className="mt-0.5 text-gray-400">{ikon}</span>
      <div className="min-w-0">
        <p className="text-[13px] leading-5 text-gray-900">
          <span className="font-semibold tabular-nums">{angka}</span> {label}
        </p>
        <p className="text-[12px] leading-4 text-gray-600">{catatan}</p>
      </div>
    </div>
  );
}

/** Pratinjau dasbor publik: dampak = baseline + realisasi yang sudah diverval (disetujui). */
export function PratinjauDasborPublik({ className = "" }: { className?: string }) {
  useContributionsSync();
  const antrean = bangunAntrean();
  const tambahan = ringkasanDashboard(antrean);
  const menunggu = hitungMenunggu(antrean).total;
  const lain = DASBOR_PUBLIK_LAINNYA;
  const ikon = "h-5 w-5";
  const bulanLalu = tambahan.akhirBulanLalu.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  /** Kenaikan angka dibanding akhir bulan lalu (data diperbarui tiap bulan). */
  const kenaikan = (baseline: number, sekarang: number, lalu: number) => {
    const awal = baseline + lalu;
    const naik = sekarang - lalu;
    const persen = awal > 0 ? (Math.abs(naik) / awal) * 100 : 0;
    const teksPersen = persen > 0 && persen < 0.1 ? "<0,1" : persen.toLocaleString("id-ID", { maximumFractionDigits: 1 });
    const warna = naik > 0 ? "text-green-700" : naik < 0 ? "text-red-700" : "text-gray-600";
    const Ikon = naik > 0 ? ArrowUpRight : naik < 0 ? ArrowDownRight : Minus;
    return (
      <span title={`Dibanding posisi akhir bulan lalu (${bulanLalu})`} className={`inline-flex items-center gap-1 font-medium ${warna}`}>
        <Ikon className="h-4 w-4 shrink-0" aria-hidden />
        {naik === 0 ? (
          "Tidak berubah dari bulan lalu"
        ) : (
          <span>
            {naik > 0 ? "Naik" : "Turun"} {formatAngka(Math.abs(naik))} ({teksPersen}%) dari bulan lalu
          </span>
        )}
      </span>
    );
  };

  return (
    <section aria-label="Pratinjau dasbor publik" className={`flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-gray-100 px-4 py-3 sm:px-5">
        <h3 className="text-[15px] font-semibold leading-[22px] text-gray-900">Pratinjau dasbor publik</h3>
        <p className="text-[12px] leading-4 text-gray-600">
          {tambahan.terakhir ? `Terakhir diperbarui ${formatWaktuVerval(tambahan.terakhir)}` : "Belum ada dampak disetujui sejak baseline"}
          {menunggu > 0 && ` · ${menunggu.toLocaleString("id-ID")} menunggu verval, belum tampil`}
        </p>
      </header>

      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Metrik
          ikon={<Users className={ikon} />}
          angka={formatAngka(BASELINE_DAMPAK.siswa + tambahan.siswa)}
          tebal="Siswa"
          sisa="telah merasakan manfaat program pendidikan"
          kenaikan={kenaikan(BASELINE_DAMPAK.siswa, tambahan.siswa, tambahan.sampaiBulanLalu.siswa)}
        />
        <Metrik
          ikon={<BookOpen className={ikon} />}
          angka={formatAngka(BASELINE_DAMPAK.guru + tambahan.guru)}
          tebal="Guru"
          sisa="telah mengikuti pengembangan kompetensi"
          kenaikan={kenaikan(BASELINE_DAMPAK.guru, tambahan.guru, tambahan.sampaiBulanLalu.guru)}
        />
        <Metrik
          ikon={<Building2 className={ikon} />}
          angka={formatAngka(BASELINE_DAMPAK.satuanPendidikan + tambahan.satuanPendidikan)}
          tebal="Satuan pendidikan"
          sisa="telah terbantu program kami"
          kenaikan={kenaikan(BASELINE_DAMPAK.satuanPendidikan, tambahan.satuanPendidikan, tambahan.sampaiBulanLalu.satuanPendidikan)}
        />
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-100 border-t border-gray-100 bg-gray-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Pendukung ikon={<CheckCircle2 className="h-4 w-4" />} angka={formatAngka(lain.program)} label="program kolaborasi berjalan" catatan={`+${formatAngka(lain.rencana.program)} dalam perencanaan`} />
        <Pendukung ikon={<MapPin className="h-4 w-4" />} angka={lain.daerah} label="daerah terjangkau" catatan={`+${formatAngka(lain.rencana.daerah)} dalam perencanaan`} />
        <Pendukung ikon={<Handshake className="h-4 w-4" />} angka={formatAngka(lain.mitra)} label="mitra berpartisipasi" catatan={`${formatAngka(lain.mitraPengajuan)} mitra dalam pengajuan`} />
      </div>

      <p className="mt-auto border-t border-gray-100 px-4 py-2 text-[12px] leading-4 text-gray-600 sm:px-5">
        Data diperbarui tiap bulan; kenaikan dibanding akhir bulan lalu ({bulanLalu}). Hanya dampak Disetujui atau Disetujui dengan Revisi yang dihitung. Program, daerah, dan mitra masih contoh.
      </p>
    </section>
  );
}
