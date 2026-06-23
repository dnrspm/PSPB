⚠️ PENTING: Ini adalah **overlay prompt khusus** untuk Dashboard Manajemen Akun PSPB (Modul Login & Manajemen Akses).

Overlay ini HARUS selalu digunakan **bersama dengan Base Prompt – Content Design Guidelines (cross system)**.

Semua aturan dalam Base Prompt tetap berlaku sepenuhnya. Jika ada aturan dalam overlay ini yang bertentangan dengan Base Prompt, **aturan yang lebih ketat yang berlaku**.

---

## **System Definition**

**Dashboard Manajemen Akun PSPB** adalah modul operasional internal yang mengelola autentikasi, kontrol akses berbasis peran, manajemen pengguna, dan audit aktivitas untuk seluruh proses operasional Partisipasi Semesta Pendidikan Bermutu (PSPB).

Modul ini menjadi fondasi seluruh operasional PSPB — memastikan setiap pengguna hanya dapat mengakses fitur dan melakukan aksi sesuai kewenangan perannya. Sistem beroperasi dalam konteks lintas unit kerja dengan proses persetujuan yang terstruktur dan dapat diaudit.

Copy MUST mencerminkan: kejelasan batas kewenangan per peran, transparansi status akses, keterbacaan proses audit, dan kepercayaan bahwa sistem berjalan sesuai aturan — bukan sekadar antarmuka administratif.

---

## **Primary Users**

* **Admin** — mengelola seluruh pengguna, peran, dan unit kerja; satu-satunya peran yang dapat membuat, mengedit, dan menonaktifkan akun  
* **Partnership Operator** — mengelola kontribusi, menjadwalkan audiensi, dan memperbarui distribusi  
* **Program Reviewer** — meninjau dan menyetujui kontribusi  
* **Strategic Reviewer** — meninjau kontribusi pada tahap strategis; tidak memiliki akses approval mandiri  
* **Legal Reviewer** — meninjau dan memfinalisasi PKS (Perjanjian Kerja Sama)  
* **Executive Viewer** — akses baca untuk monitoring; tidak dapat melakukan aksi operasional kecuali pada konteks tertentu

Users diasumsikan:

* Adalah pengguna internal PSPB yang sudah terdaftar oleh Admin  
* Memahami konteks operasional PSPB secara umum  
* Tidak selalu familiar dengan sistem — instruksi harus eksplisit, terutama untuk pesan error dan pembatasan akses  
* Membutuhkan kejelasan instan: apa yang boleh dilakukan, apa yang tidak, dan mengapa

JANGAN asumsikan pengguna memahami logika permission secara otomatis. JANGAN tampilkan pesan error teknis tanpa panduan tindak lanjut yang jelas.

---

## **Core User Intent**

**Admin** datang ke dashboard untuk:

* Membuat, mengedit, atau menonaktifkan akun pengguna  
* Menetapkan peran dan unit kerja  
* Memantau aktivitas dan histori masuk  
* Mengekspor Catatan Aktivitas

**Pengguna operasional (semua peran selain Admin)** datang ke dashboard untuk:

* Masuk ke sistem dan mengakses Ruang Kerja Operasional sesuai peran  
* Mengatur ulang kata sandi jika diperlukan  
* Memahami aksi apa yang tersedia untuk mereka di tahap alur kerja saat ini

Copy MUST memprioritaskan:

* Orientasi peran yang jelas setelah login — pengguna harus langsung tahu di mana mereka berada  
* Pesan akses ditolak yang informatif — bukan sekadar "tidak diizinkan"  
* Transparansi status akun dan tahap alur kerja  
* Langkah konkret setelah setiap aksi atau error

---

## **Mandatory Terminology (Strict Enforcement)**

Gunakan istilah berikut **persis seperti tertulis**. Variasi, sinonim, atau alternatif kasual TIDAK diperbolehkan kecuali didefinisikan secara eksplisit di bawah.

### **Nama Peran (Title Case, tidak disingkat)**

* "Admin"  
* "Partnership Operator"  
* "Program Reviewer"  
* "Strategic Reviewer"  
* "Legal Reviewer"  
* "Executive Viewer"

JANGAN gunakan:

* Singkatan tidak resmi: "SA", "PO", "PR" sebagai label UI  
* "User" atau "pengguna" sebagai pengganti nama peran spesifik

### **Nama Halaman & Ruang Kerja**

* "Ruang Kerja Operasional" — halaman utama setelah login, sesuai konteks dalam bahasa Indonesia  
* "Manajemen Pengguna" — halaman pengelolaan akun  
* "Manajemen Peran" — halaman pengelolaan peran dan kewenangan  
* "Catatan Aktivitas" — halaman audit log

JANGAN gunakan:

* "dashboard" atau "dasbor" sebagai pengganti nama halaman spesifik  
* "Audit Log" (gunakan "Catatan Aktivitas" dalam UI; "Audit Log" hanya untuk konteks teknis/ekspor)  
* "Workspace" tanpa terjemahan (gunakan "Ruang Kerja Operasional")

### **Istilah Manajemen Akun**

* "kata sandi" — JANGAN gunakan "password" dalam copy UI  
* "tautan reset kata sandi" — JANGAN gunakan "reset link"  
* "nonaktifkan akun" — JANGAN gunakan "deactivate", "suspend", atau "hapus akun"  
* "aktifkan akun" — JANGAN gunakan "activate" atau "enable"  
* "unit kerja" — JANGAN gunakan "department", "divisi", atau "bagian"

### **Istilah Akses & Kewenangan**

* "peran" — merujuk ke role pengguna; JANGAN gunakan "role" dalam copy UI  
* "kewenangan" — merujuk ke permission; JANGAN gunakan "permission" atau "hak akses" secara bergantian  
* "tahap alur kerja" — merujuk ke workflow state; JANGAN gunakan "workflow state" dalam copy UI  
* "PKS" — singkatan resmi dari Perjanjian Kerja Sama; boleh digunakan setelah disebut lengkap

JANGAN gunakan:

* "RBAC", "role-based", atau istilah teknis sistem dalam copy yang menghadap pengguna  
* "credential" — gunakan "email dan kata sandi"  
* "session" — gunakan "sesi"

---

## **Institutional Naming Conventions**

### **Nama Sistem dan Peran (Title Case)**

* "PSPB"  
* "Admin"  
* "Ruang Kerja Operasional"  
* "Manajemen Pengguna"  
* "Manajemen Peran"  
* "Catatan Aktivitas"

### **Referensi platform (sentence case)**

* "sistem"  
* "kami" (merujuk ke sistem)

---

## **Content Behavior Rules (Dashboard Manajemen Akun PSPB–Specific)**

* JANGAN tampilkan istilah teknis sistem (token, session ID, stack trace, error code) kepada pengguna.  
* JANGAN gunakan frasa yang mengaburkan siapa yang berwenang atas suatu aksi.  
* Selalu bedakan antara:  
  * Akun tidak aktif vs. akun tidak ditemukan  
  * Kewenangan tidak dimiliki vs. tahap alur kerja belum sesuai  
  * Aksi berhasil disimpan vs. aksi selesai diproses  
* Pesan pembatasan akses HARUS menjelaskan alasannya, dan jika memungkinkan, memberi tahu siapa yang bisa dihubungi.

Contoh:

✅ "Akun Anda tidak memiliki kewenangan untuk melakukan aksi ini." ❌ "Access denied." / "Error 403."

✅ "Tombol ini tidak tersedia karena kontribusi belum berada di tahap yang sesuai." ❌ "Permission not found."

✅ "Akun ini telah dinonaktifkan. Hubungi Admin untuk informasi lebih lanjut." ❌ "User inactive."

### **Batas Kewenangan per Peran (Critical Rule)**

Copy TIDAK BOLEH menyiratkan bahwa:

* Partnership Operator dapat menyetujui kontribusi secara mandiri  
* Strategic Reviewer atau Executive Viewer memiliki kewenangan penuh atas persetujuan  
* Legal Reviewer dapat melakukan aksi di luar tahap PKS  
* Pengguna selain Admin dapat membuat atau menonaktifkan akun

Admin adalah satu-satunya peran yang:

* Membuat, mengedit, dan menonaktifkan akun pengguna  
* Menetapkan peran dan unit kerja  
* Mengakses dan mengekspor Catatan Aktivitas secara penuh

Contoh:

✅ "Hanya Admin yang dapat menambahkan atau menonaktifkan pengguna." ❌ "Anda tidak memiliki akses ke halaman ini." *(tanpa penjelasan)*

✅ "Persetujuan kontribusi ini membutuhkan kewenangan Program Reviewer." ❌ "Anda tidak bisa menyetujui ini."

---

## **Copy per Komponen UI**

### **Halaman Masuk**

| Elemen | Copy |
| ----- | ----- |
| Judul halaman | `Masuk ke PSPB` |
| Label email | `Email` |
| Placeholder email | `nama@organisasi.go.id` |
| Label kata sandi | `Kata Sandi` |
| Link lupa kata sandi | `Lupa kata sandi?` |
| CTA login | `Masuk` |

### **Halaman Lupa Kata Sandi**

| Elemen | Copy |
| ----- | ----- |
| Judul | `Atur Ulang Kata Sandi` |
| Subtext | `Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.` |
| Label email | `Email terdaftar` |
| CTA | `Kirim Tautan` |
| Konfirmasi terkirim | `Tautan pengaturan ulang kata sandi telah dikirim ke email Anda. Tautan berlaku selama [X] menit.` |

### **Halaman Atur Ulang Kata Sandi**

| Elemen | Copy |
| ----- | ----- |
| Judul | `Buat Kata Sandi Baru` |
| Label kata sandi baru | `Kata Sandi Baru` |
| Helper text | `Minimal 8 karakter.` |
| Label konfirmasi | `Ulangi Kata Sandi Baru` |
| CTA | `Simpan Kata Sandi` |
| Konfirmasi berhasil | `Kata sandi berhasil diperbarui. Silakan masuk kembali.` |

---

## **Empty States**

Empty states HARUS:

* Menyatakan kondisi dengan jelas — bukan hanya "tidak ada data"  
* Menginformasikan apakah ada tindakan yang bisa dilakukan

| Halaman | Kondisi | Copy |
| ----- | ----- | ----- |
| Manajemen Pengguna | Belum ada pengguna | `Belum ada pengguna yang terdaftar. Tambahkan pengguna pertama untuk memulai.` |
| Manajemen Pengguna | Filter tidak menemukan hasil | `Tidak ada pengguna yang cocok dengan pencarian ini. Coba kata kunci atau filter lain.` |
| Catatan Aktivitas | Belum ada aktivitas | `Belum ada aktivitas yang tercatat untuk periode ini.` |
| Catatan Aktivitas | Filter tidak menemukan hasil | `Tidak ada aktivitas yang cocok dengan filter ini. Coba ubah rentang tanggal atau jenis aksi.` |

---

## **Error & Validation Messaging**

Error HARUS menjelaskan apakah masalahnya terkait:

* Data (input tidak valid atau tidak lengkap)  
* Kewenangan (peran tidak memiliki akses)  
* Status akun (tidak aktif, peran belum ditetapkan)  
* Sistem (gangguan teknis)

| Skenario | Copy |
| ----- | ----- |
| Email atau kata sandi salah | `Email atau kata sandi tidak sesuai. Periksa kembali dan coba lagi.` |
| Akun tidak memiliki peran aktif | `Akun Anda belum memiliki peran yang ditetapkan. Hubungi Admin untuk bantuan.` |
| Akun tidak aktif | `Akun ini tidak aktif. Hubungi Admin untuk informasi lebih lanjut.` |
| Email tidak terdaftar (forgot password) | `Email ini tidak terdaftar di sistem. Periksa kembali atau hubungi Admin.` |
| Tautan reset kedaluwarsa | `Tautan ini sudah tidak berlaku. Minta tautan baru melalui halaman lupa kata sandi.` |
| Kata sandi tidak cocok | `Kata sandi tidak sama. Periksa kembali dan coba lagi.` |
| Aksi tidak diizinkan (permission) | `Anda tidak memiliki kewenangan untuk melakukan aksi ini. Hubungi Admin jika ini tidak sesuai.` |
| Aksi tidak tersedia (workflow state) | `Aksi ini tidak tersedia untuk tahap alur kerja saat ini.` |
| Email duplikat saat buat user | `Email ini sudah terdaftar. Gunakan email lain atau cek daftar pengguna yang sudah ada.` |
| Gangguan sistem (umum) | `Terjadi gangguan pada sistem. Coba beberapa saat lagi atau hubungi Admin.` |

---

## **Scope Reminder**

* Overlay ini berlaku **hanya** untuk Dashboard Manajemen Akun PSPB (Modul Login & Manajemen Akses).  
* HARUS dikombinasikan dengan Base Prompt untuk setiap pembuatan konten atau UI.  
* JANGAN gunakan overlay ini untuk modul PSPB lainnya, Landing Page PSPB, atau sistem lain seperti BSAN atau Pengelolaan Kinerja.  
* Untuk modul operasional PSPB lainnya (review kontribusi, PKS, distribusi, publikasi), gunakan overlay terpisah yang sesuai.

Kegagalan menerapkan overlay ini bersama Base Prompt membatalkan output yang dihasilkan.

