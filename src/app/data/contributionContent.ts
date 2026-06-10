// Konfigurasi konten untuk setiap program kontribusi
// Berdasarkan: /src/imports/konten-detail-kontribusi.md

export interface ContributionOption {
  value: string;
  label: string;
  prasyaratSubstansi?: string[];
  prasyaratTeknis?: string[];
  deskripsi?: string;
}

export interface ProgramContentConfig {
  fieldLabel: string;
  placeholder: string;
  options: ContributionOption[];
}

// 1. PENGEMBANGAN PLATFORM DIGITAL
export const platformDigitalContent: ProgramContentConfig = {
  fieldLabel: "Pilihan Pengembangan",
  placeholder: "Pilih Pengembangan",
  options: [
    {
      value: "sso-belajar-id",
      label: "Pemberian Akses SSO Akun Belajar.id",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Tidak terdapat biaya dalam proses integrasi dan atau mendukung proses integrasi berlangsung",
        "Kementerian dan seluruh ekosistem pada Kementerian tidak mengeluarkan dana untuk membayar fitur atau servis yang diberikan oleh Mitra sesuai cakupan kerjasama",
        "Penyediaan fitur atau servis pada platform Mitra untuk mendukung kegiatan belajar mengajar",
        "Terdapat manfaat fitur atau service pada platform Mitra yang hanya diperoleh apabila integrasi Belajar.id dilaksanakan"
      ],
      prasyaratTeknis: [
        "Kesesuaian dan kemampuan integrasi SSO oleh Mitra terhadap sistem Akun BID",
        "Proses integrasi dapat menggunakan lookup atau whitelist berdasar informasi user pada masing-masing jenjang atau subdomain",
        "Kecocokan platform mitra dengan kebutuhan kementerian (digunakan oleh guru)"
      ]
    },
    {
      value: "integrasi-rumah-pendidikan",
      label: "Integrasi Layanan ke dalam Rumah Pendidikan",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Tidak terdapat biaya dalam proses pengembangan atau integrasi fitur",
        "Kementerian dan seluruh ekosistem pada Kementerian tidak mengeluarkan dana untuk membayar fitur atau servis yang diberikan oleh Mitra sesuai cakupan kerjasama",
        "Kontribusi mitra sejalan dengan fungsi ruang yang dituju dan sesuai kebutuhan fitur kelompok sasaran utama (ekosistem pada pendidikan)",
        "Dukungan Mitra memiliki pendekatan berbasis kebutuhan pengguna (user-centered)",
        "Mitra mampu menyediakan dukungan berkelanjutan (pelatihan, pendampingan, atau dukungan teknis) di ruang yang dituju"
      ],
      prasyaratTeknis: [
        "Kesesuaian desain atau UI/UX pada sistem Rumah Pendidikan",
        "Lokasi infrastruktur (server dan data) berada di wilayah Indonesia",
        "Adanya implementasi 3-tier arsitektur sistem",
        "HTTPS aktif pada sistem Mitra"
      ]
    }
  ]
};

// 2. BAHAN AJAR DIGITAL
export const bahanAjarDigitalContent = {
  jenjangLabel: "Pilih jenjang pendidikan untuk Guru dan Murid",
  jenjangOptions: [
    { value: "paud-tk", label: "PAUD/TK" },
    { value: "sd", label: "SD" },
    { value: "smp", label: "SMP" },
    { value: "sma", label: "SMA" },
    { value: "smk", label: "SMK" },
    { value: "kesetaraan", label: "Kesetaraan" },
    { value: "slb", label: "SLB" },
    { value: "pendidikan-khusus", label: "Pendidikan Khusus" }
  ],
  prasyaratGuru: {
    prasyaratSubstansi: [
      "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
      "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
      "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
      "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
    ],
    prasyaratTeknis: [
      "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
      "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
      "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
      "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
      "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
    ]
  },
  prasyaratMurid: {
    prasyaratSubstansi: [
      "Skema kemitraan bersifat nonkomersial",
      "Tidak ada biaya yang dibebankan ke Kemendikdasmen dan ekosistemnya dalam proses pengembangan maupun pemenuhan kontribusi",
      "Kontribusi selaras dengan kebutuhan di Ruang Murid dan sesuai dengan CP/ATP terbaru",
      "Informasi dalam materi (teks, visual, audio) bersifat faktual, tidak mengandung unsur hoaks, dan berasal dari sumber yang dapat dipertanggungjawabkan"
    ],
    prasyaratTeknis: [
      "Kontribusi Sumber Belajar tersedia dalam bentuk Materi Interaktif, Gim Edukasi, Lab Maya, Video, atau PDF",
      "Kontribusi Latihan Soal tersedia dalam tipe Soal Olimpiade, UTBK, TKA, Ujian Sekolah (PTS, PAS, PAT), Asesmen Nasional, atau IELTS/TOEFL",
      "Materi tipe video disediakan dalam link YouTube",
      "Materi tipe artikel disediakan dalam format PDF",
      "Materi tipe Interaktif disediakan dalam file HTML5"
    ]
  }
};

// 3. PENDAMPINGAN PELATIHAN GTK
export const pelatihanGTKContent: ProgramContentConfig = {
  fieldLabel: "Topik Materi Pelatihan",
  placeholder: "Pilih topik",
  options: [
    {
      value: "literasi-numerasi",
      label: "Literasi Numerasi",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    },
    {
      value: "bimbingan-konseling",
      label: "Bimbingan Konseling",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    },
    {
      value: "pembelajaran-mendalam",
      label: "Pembelajaran Mendalam",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    },
    {
      value: "pengembangan-kompetensi-gtk",
      label: "Pengembangan Kompetensi Guru dan Tenaga Kependidikan",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    },
    {
      value: "koding-ai",
      label: "Koding dan Kecerdasan Artifisial",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    },
    {
      value: "lainnya",
      label: "Lainnya",
      prasyaratSubstansi: [
        "Telah memiliki pengalaman dalam menyelenggarakan pelatihan pengembangan kompetensi Guru dan Tenaga Kependidikan, sesuai dengan bidang prioritas khususnya yang relevan dengan topik-topik prioritas terkait.",
        "Menyediakan materi pelatihan yang sesuai dengan kebutuhan pengembangan kompetensi Guru & Tenaga Kependidikan dan mendukung pencapaian tujuan pembelajaran sesuai dengan kebijakan Kemendikdasmen.",
        "Memiliki bukti atau dokumentasi yang menunjukkan dampak positif dari pelatihan yang telah dilaksanakan, seperti peningkatan hasil belajar, dan atau evaluasi peserta.",
        "Berkomitmen untuk tidak melakukan monetisasi terhadap peserta pada saat proses pelaksanaan pelatihan atau dalam pelaksanaan perjanjian kerjasama berlangsung."
      ],
      prasyaratTeknis: [
        "Mitra memiliki dukungan sumber daya yang memadai, termasuk narasumber, fasilitator, dan tim teknis, yang mampu mendukung pelaksanaan pelatihan secara daring, luring, maupun hybrid.",
        "Menyediakan media pembelajaran yang sesuai dengan kebutuhan pelatihan, seperti presentasi, video, bahan ajar interaktif, serta mendukung keterpaduan dengan platform digital yang digunakan.",
        "Bersedia memfasilitasi kebutuhan pelatihan, termasuk akomodasi penyediaan ruang daring atau lokasi kegiatan luring, konsumsi, transportasi, ATK serta suvenir atau goodie bag.",
        "Menyediakan silabus, modul, atau dokumen pendukung pelatihan lainnya yang terdokumentasi dengan baik dan dapat dikaji oleh pihak kementerian sebelum pelaksanaan.",
        "Narasumber, pelatih, atau fasilitator yang ditugaskan oleh mitra memiliki latar belakang dan keahlian yang sesuai dengan topik pelatihan yang disampaikan."
      ]
    }
  ]
};

// 4. KEBUTUHAN PENDIDIKAN LAINNYA
export const kebutuhanLainnyaContent: ProgramContentConfig = {
  fieldLabel: "Jenis Dukungan",
  placeholder: "Pilih jenis dukungan yang ingin Anda ajukan",
  options: [
    {
      value: "beasiswa",
      label: "Beasiswa",
      deskripsi: "Dukungan kebutuhan individual bagi peserta didik untuk melaksanakan pembelajaran."
    },
    {
      value: "penanganan-anak-tidak-sekolah",
      label: "Penanganan Anak Tidak Sekolah",
      deskripsi: "Dukungan program pembelajaran untuk persiapan anak mengejar pelajaran dan kembali ke sekolah."
    },
    {
      value: "dukungan-vokasi",
      label: "Beragam Dukungan Pendidikan Vokasi",
      deskripsi: "Dukungan dalam bentuk penyediaan sumber daya dan/atau fasilitas untuk memperkuat pelaksanaan program pendidikan vokasi dalam perluasan akses peserta didik terhadap kesempatan belajar yang relevan."
    },
    {
      value: "kegiatan-pendidikan",
      label: "Kegiatan Pendidikan",
      deskripsi: "Dukungan terhadap pelaksanaan pembinaan tambahan dan memfasilitasi keikutsertaan bagi peserta didik berprestasi nasional sebagai persiapan menuju ajang kompetisi internasional."
    },
    {
      value: "publikasi-komunikasi",
      label: "Publikasi dan Komunikasi",
      deskripsi: "Dukungan terhadap publikasi, komunikasi, dan penempatan media dalam rangka memperluas jangkauan informasi publik serta memperkuat diseminasi kebijakan dan program."
    },
    {
      value: "lainnya",
      label: "Lainnya",
      deskripsi: ""
    }
  ]
};

// 5. INFRASTRUKTUR DIGITAL
export const infrastrukturDigitalContent: ProgramContentConfig = {
  fieldLabel: "Pilihan Kontribusi",
  placeholder: "Pilih kontribusi",
  options: [
    {
      value: "jaringan-internet",
      label: "Jaringan Internet",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Penyediaan konektivitas internet untuk mendukung akses sumber belajar digital",
        "Dukungan berkelanjutan untuk pemeliharaan konektivitas"
      ],
      prasyaratTeknis: [
        "Kecepatan internet sesuai standar minimal yang ditetapkan",
        "Infrastruktur jaringan yang andal dan siap pakai",
        "Cakupan area yang memadai untuk seluruh pengguna di satuan pendidikan"
      ]
    },
    {
      value: "instalasi-listrik",
      label: "Instalasi Listrik",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Penyediaan sumber daya listrik yang stabil untuk proses pembelajaran",
        "Dukungan pemeliharaan sistem kelistrikan"
      ],
      prasyaratTeknis: [
        "Sistem kelistrikan sesuai standar SNI",
        "Daya listrik memenuhi kebutuhan satuan pendidikan",
        "Terdapat sistem pengaman dan proteksi sesuai regulasi"
      ]
    }
  ]
};

// 6. REVITALISASI SEKOLAH
export const revitalisasiSekolahContent: ProgramContentConfig = {
  fieldLabel: "Pilihan Revitalisasi",
  placeholder: "Pilih revitalisasi",
  options: [
    {
      value: "lapangan",
      label: "Lapangan",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Pembangunan atau renovasi fasilitas lapangan untuk kegiatan belajar dan olahraga"
      ],
      prasyaratTeknis: [
        "Lahan tersedia dan sesuai peruntukan",
        "Desain sesuai standar fasilitas pendidikan",
        "Material bangunan sesuai spesifikasi teknis yang ditentukan"
      ]
    },
    {
      value: "toilet",
      label: "Toilet",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Pembangunan atau renovasi fasilitas sanitasi sekolah"
      ],
      prasyaratTeknis: [
        "Sistem plumbing sesuai standar",
        "Jumlah unit toilet sesuai rasio pengguna",
        "Fasilitas ramah disabilitas"
      ]
    },
    {
      value: "laboratorium",
      label: "Laboratorium",
      prasyaratSubstansi: [
        "Kemitraan berjalan dengan skema non komersial",
        "Penyediaan atau renovasi laboratorium untuk mendukung pembelajaran praktik"
      ],
      prasyaratTeknis: [
        "Ruangan memenuhi standar laboratorium pendidikan",
        "Peralatan laboratorium sesuai kebutuhan kurikulum",
        "Sistem keselamatan kerja tersedia"
      ]
    }
  ]
};

// Mapping program title ke content config
export const programContentMapping: Record<string, any> = {
  "Infrastruktur Digital": infrastrukturDigitalContent,
  "Pengembangan Platform Digital": platformDigitalContent,
  "Revitalisasi Sekolah": revitalisasiSekolahContent,
  "Bahan Ajar Digital": bahanAjarDigitalContent,
  "Pendampingan Pelatihan GTK": pelatihanGTKContent,
  "Kebutuhan Pendidikan Lainnya": kebutuhanLainnyaContent,
};

// Helper function untuk mendapatkan content config berdasarkan program title
export function getProgramContent(programTitle: string): any {
  return programContentMapping[programTitle] || null;
}