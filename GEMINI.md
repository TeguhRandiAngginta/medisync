# MediSync — Panduan Arsitektur, Stack Teknologi & Konvensi Pengembang

Dokumen ini merupakan panduan utama arsitektur, basis teknologi, alur bisnis, serta aturan *coding* (konvensi) proyek **MediSync**. File ini ditujukan sebagai referensi mutlak bagi pengembang dan asisten AI dalam sesi pengembangan selanjutnya.

---

## 1. Ringkasan Proyek (Project Overview)

**MediSync** adalah Sistem Informasi Manajemen Apotek (*Pharmacy Management System* / SIM Apotek) modern berbasis web yang dirancang untuk mendukung operasional multi-cabang dan multi-peran (*multi-role*).

Fitur unggulan utama MediSync meliputi:
- **FEFO (First Expired, First Out) Inventory Management**: Alokasi dan pemotongan stok otomatis berdasarkan *batch* obat dengan tanggal kedaluwarsa terdekat.
- **Integrasi Google Gemini AI**:
  - *OCR Resep Dokter*: Ekstraksi cerdas foto/scan resep dokter, pencocokan otomatis dengan katalog obat, dan rekomendasi alternatif jika stok kosong.
  - *Scan Faktur Pembelian (PBF)*: Ekstraksi data nomor faktur, tanggal, nama obat, batch, kedaluwarsa, dan harga beli langsung ke form pembelian.
  - *Smart Search Gejala di POS*: Rekomendasi zat aktif atau kelompok obat berdasarkan keluhan/gejala klinis pasien.
- **Sistem Shift Kasir & Laci Kasir (*Cash Register*)**: Mengunci sesi kerja kasir mulai dari *open shift* (modal awal) hingga *close shift* (rekonsiliasi fisik vs nominal sistem).
- **Audit Trail Komprehensif**: Pencatatan riwayat setiap mutasi stok, pembatalan/penghapusan penjualan, dan aksi krusial pengguna.
- **Laporan & Pembukuan**: Kalkulasi omzet, HPP (Harga Pokok Penjualan/COGS), laba kotor, kartu stok (*stock ledger*), serta ekspor ke Excel dan PDF.

---

## 2. Stack Teknologi & Lingkungan Pengembangan

### Backend
- **Framework**: Laravel 12.x
- **Bahasa**: PHP ^8.2
- **Arsitektur**: Monolith Modular dengan Service Layer & Inertia.js Adapter
- **Database**: PostgreSQL (`pgsql`) — *Case-insensitive matching menggunakan `ilike`*
- **Autentikasi & Otorisasi**: Laravel Breeze (Session-based) + Custom `RoleMiddleware`
- **Export / Reporting**:
  - `barryvdh/laravel-dompdf` (^3.1) untuk pembuatan cetak PDF (faktur, laporan, resep)
  - `maatwebsite/excel` (^4.0) untuk ekspor spreadsheet laporan keuangan & stok
- **Routing Client**: `tightenco/ziggy` (^2.0) untuk helper `route()` di sisi frontend

### Frontend
- **Framework**: React 18.2.x (SPA via `@inertiajs/react` ^2.0)
- **Build Tool**: Vite 7.x (`@vitejs/plugin-react` & `laravel-vite-plugin`)
- **Styling**: Tailwind CSS 3.x (`@tailwindcss/forms`), dukungan penuh **Dark Mode** (`class`-based)
- **UI & Helper Libraries**:
  - `@headlessui/react` (^2.0): Komponen modal, dropdown, dan transisi
  - `recharts` (^3.10): Visualisasi grafik penjualan & produk terlaris di Dashboard
  - `html5-qrcode` (^2.3): Pemindai barcode/QR langsung melalui webcam/kamera HP
  - `react-phone-number-input` (^3.4): Validasi input format nomor telepon
  - `axios` (^1.11): Komunikasi API internal

### Integrasi AI
- **Provider**: Google Generative AI (Gemini REST API v1beta)
- **Model Fallback Chain**: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-3.8-flash`
- **Handler**: `App\Services\GoogleAIService`

### Environment Lokal
- **Server**: Laragon / Apache / Nginx (Windows x64)
- **PHP Path**: PHP 8.2+ dengan ekstensi `pdo_pgsql`, `pgsql`, `gd`, `fileinfo`, `zip` aktif
- **PostgreSQL**: Port 5432 (Database: `medisync`)

---

## 3. Struktur Direktori Proyek

```
medisync/
├── app/
│   ├── Actions/               # Action classes (disiapkan untuk DDD/single-responsibility)
│   ├── Domain/                # Domain folders (AI, Auth, Catalog, Finance, Inventory, Medical, Purchasing, Sales)
│   ├── Exports/               # Class ekspor Excel (ReportExport.php)
│   ├── Http/
│   │   ├── Controllers/       # Controller utama (Pos, Product, Purchase, Prescription, Report, dll)
│   │   ├── Middleware/        # Middleware (RoleMiddleware, HandleInertiaRequests)
│   │   └── Requests/          # Form Requests validasi input
│   ├── Models/                # Eloquent Models (Medicine, ProductBatch, Sale, Purchase, CashRegister, dll)
│   ├── Policies/              # Authorization policies (SalePolicy, dll)
│   ├── Providers/             # Service Providers Laravel
│   └── Services/              # Business Logic & External API Layer (InventoryService, GoogleAIService, AlertService)
├── database/
│   ├── migrations/            # Skema tabel database (termasuk soft deletes & foreign keys)
│   └── seeders/               # DatabaseSeeder, MasterDataSeeder (Role, Branch, BPOM Category)
├── resources/
│   ├── css/                   # app.css (Tailwind directives)
│   └── js/
│       ├── Components/        # Reusable UI (Modal, BarcodeScannerModal, ConfirmModal, Buttons, Inputs)
│       ├── Layouts/           # AuthenticatedLayout (Sidebar, Header, Shift indicator, Dark mode), GuestLayout
│       ├── Pages/             # Inertia React Pages (Pos, Dashboard, Products, Purchases, Prescriptions, dll)
│       └── Utils/             # Helper client-side (printHelper.js untuk struk kasir)
├── routes/
│   ├── web.php                # Rute web aplikasi utama
│   ├── auth.php               # Rute autentikasi (Login, Register, Password Reset)
│   └── console.php            # Artisan console routes
└── GEMINI.md                  # File panduan arsitektur & aturan proyek (dokumen ini)
```

---

## 4. Role & Hak Akses (RBAC)

Sistem menggunakan 3 tingkatan peran utama (`roles.slug`):

| Peran (`slug`) | Deskripsi | Lingkup Akses Menu & Aksi |
| :--- | :--- | :--- |
| **`superadmin`** | Pemilik / Direktur / Admin Utama | **Akses Penuh**: Manajemen Pengguna, Audit Log, Data Referensi Master, Pembukuan & Laporan Eksekutif, Stok Opname, Pembelian, Resep, Katalog Obat, Kasir (POS). |
| **`apoteker`** | Pengelola Farmasi & Gudang | **Inventaris & Operasional**: Katalog Obat, Pemasok/Supplier, Lokasi Rak, Faktur Pembelian PBF, Monitoring Batch ED, Stock Opname, Resep Masuk, POS. |
| **`kasir`** | Operator Kasir Penjualan | **Frontline Transaksi**: Point of Sale (POS), Buka/Tutup Shift Laci Kasir, Resep Masuk, Riwayat Penjualan (cetak ulang struk). |

- **Middleware Proteksi**: `Route::middleware(['auth', 'verified', 'role:superadmin,apoteker'])`
- **Inactive Account Guard**: Akun dengan status `is_active = false` dicegah login secara otomatis melalui `LoginRequest.php`.

---

## 5. Arsitektur Data & Model Utama

1. **`Medicine` (Katalog Obat)**
   - Representasi entitas obat dengan atribut: `sku`, `barcode`, `name`, `generic_name`, `dosage_form`, `dosage_strength`, `base_unit`, `selling_price`, `min_stock`, `max_stock`, `requires_prescription`.
   - Relasi: `belongsTo(MedicineCategory)`, `belongsTo(Supplier)`, `belongsTo(Rack)`, `hasMany(ProductBatch)`.
   - Field `stock` merupakan kalkulasi total dari seluruh *batch* aktif yang belum kedaluwarsa.
2. **`ProductBatch` (Batch & Kedaluwarsa - FEFO)**
   - Setiap pembelian obat menghasilkan *batch* baru dengan atribut: `batch_number`, `expired_date`, `stock_quantity`, `purchase_price`.
   - Memiliki `SoftDeletes`.
3. **`Purchase` & `PurchaseDetail` (Faktur Pembelian PBF)**
   - Mencatat pengadaan obat dari Pedagang Besar Farmasi (PBF).
   - Menyimpan `internal_receipt_number`, `invoice_number`, `purchase_date`, `total_amount`.
   - Saat disimpan, otomatis memutakhirkan/membuat `ProductBatch` baru dan mencatat ke `AuditLog`.
4. **`Sale` & `SaleDetail` (Penjualan / Transaksi POS)**
   - Menyimpan `invoice_number`, `user_id`, `cash_register_id`, nominal pembayaran, metode (`Cash`, `QRIS`, `Transfer`).
   - Dilengkapi **Model Event Booting**:
     - Event `deleting` (Soft Delete): Otomatis memicu `InventoryService::restoreStockFEFO()` untuk membatalkan pengurangan stok.
     - Event `restored`: Otomatis memotong kembali stok melalui `InventoryService::deductStockFEFO()`.
5. **`Prescription` & `PrescriptionItem` (Resep Dokter)**
   - Mencatat resep yang diunggah dan dianalisis melalui AI.
   - Status: `DRAFT` (belum ditebus) dan `DISPENSED` (sudah ditebus di POS).
6. **`CashRegister` (Sesi Shift Kasir)**
   - Merekam waktu buka (`opened_at`), nominal modal (`opening_amount`), waktu tutup (`closed_at`), nominal riil laci (`closing_amount`), serta breakdown otomatis sistem (`system_cash_amount`, `system_qris_amount`, `system_transfer_amount`).
7. **`AuditLog`**
   - Merekam jejak audit: `user_id`, `module`, `action` (`CREATE`, `UPDATE`, `DELETE`, `RESTORE`), `description`, dan `ip_address`.

---

## 6. Layanan Utama (Service Layer)

### `InventoryService`
- **`deductStockFEFO(int $medicineId, int $requestedQty): float`**
  - Mengunci row batch dengan `lockForUpdate()`.
  - Mengambil batch aktif yang belum kedaluwarsa, diurutkan secara `expired_date ASC`.
  - Mengurangi stok sesuai kebutuhan, menghitung rata-rata HPP yang dikeluarkan, menyinkronkan stok induk `Medicine`, dan mencatat audit log.
- **`restoreStockFEFO(int $medicineId, int $quantity): void`**
  - Mengembalikan stok ke batch terbaru pada saat pembatalan transaksi.
- **`syncMedicineStock(int $medicineId): void`**
  - Menghitung ulang `sum(stock_quantity)` dari `product_batches` dan mengupdate kolom `stock` di `medicines`.
- **`adjustBatchStock(int $batchId, int $actualStock, string $type, ?string $notes = null): void`**
  - Eksekusi stok opname pada batch tertentu, mencatat mutasi di `stock_adjustments`, dan menulis deskripsi ke `AuditLog`.

### `GoogleAIService`
- Menangani koneksi ke Google Gemini Generative AI dengan *automatic model fallback*.
- Mengirim instruksi prompt untuk memaksa respons JSON murni (menggunakan `responseMimeType: 'application/json'`).
- Membersihkan pembungkus Markdown (` ```json ... ``` `) sebelum melakukan decoding.

### `AlertService`
- **`getExpiringBatches(int $daysThreshold = 90)`**: Mengidentifikasi batch yang akan atau sudah kedaluwarsa dengan label status (`EXPIRED`, `CRITICAL` <= 30 hari, `WARNING` <= 90 hari).
- **`getLowStockMedicines()`**: Mengambil obat aktif yang jumlah stoknya berada di bawah ambang batas `min_stock`.

---

## 7. Aturan Coding & Konvensi Pengembang (Coding Rules)

Untuk menjaga kualitas, integritas data medis, serta konsistensi arsitektur kode di seluruh proyek, ikuti aturan-aturan berikut:

### A. Aturan Backend (PHP / Laravel)
1. **Transaksional Database & Row Locking**:
   - Setiap operasi yang mengubah lebih dari satu tabel (terutama mutasi stok obat, pembuatan faktur pembelian, penjualan POS, dan penutupan shift) **wajib** dibungkus dalam `DB::transaction(function() { ... })` atau `DB::beginTransaction() ... DB::commit() ... DB::rollBack()`.
   - Gunakan `lockForUpdate()` pada entitas `Medicine`, `ProductBatch`, atau `Prescription` saat memeriksa dan memotong ketersediaan stok untuk mencegah *race condition* (pembelian bersamaan).
2. **Kueri PostgreSQL & Case Sensitivity**:
   - MediSync menggunakan PostgreSQL. Selalu gunakan operator **`ilike`** (bukan `like`) saat melakukan pencarian teks bebas (misal pencarian nama obat, SKU, barcode, atau nama supplier).
3. **Pemisahan Logika Bisnis (Fat Model/Service, Thin Controller)**:
   - Hindari meletakkan logika mutasi stok langsung di dalam Controller. Selalu manfaatkan metode di `InventoryService`.
   - Panggilan AI wajib dipusatkan melalui `GoogleAIService`.
4. **Audit Trail Mandatori**:
   - Setiap kali terjadi penambahan, pengubahan krusial, pembatalan/penghapusan data inventaris, wajib memanggil:
     ```php
     AuditLog::record('nama_modul', 'ACTION', 'Deskripsi detail tindakan...');
     ```
5. **Integritas Relasi Data Master**:
   - Jangan langsung menghapus data master (Supplier, Lokasi Rak, Kategori Obat) tanpa memastikan tidak ada relasi aktif pada tabel `medicines` atau `purchases`. Lakukan pengecekan `->exists()` dan beri pesan validasi ramah pengguna.
6. **Penanganan Waktu & Mata Uang**:
   - Gunakan format tanggal standar ISO `Y-m-d` atau `Y-m-d H:i:s`.
   - Nilai moneter (harga beli, harga jual, subtotal, diskon) disimpan dalam tipe numerik/decimal presisi tanpa format pemisah ribuan di database. Pemisah ribuan hanya diterapkan saat presentasi di frontend/PDF.

### B. Aturan Frontend (React / Inertia.js)
1. **Dukungan Dark Mode Wajib**:
   - Setiap penambahan halaman baru atau modifikasi komponen UI **wajib menyertakan styling mode gelap** menggunakan prefix `dark:` dari Tailwind CSS (misal `bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-100`).
   - Warna tema aksen MediSync:
     - Hijau Mint / Emerald Aksen: `#48CFA4` / `#246A55` / `#67E2B4`
     - Background Gelap: `#151D23` (Body), `#1E272E` (Card/Sidebar), `#212E36` (Hover/Input)
     - Background Terang: `#F4F7F6` (Body), `#FFFFFF` (Card/Sidebar), `#EAF5F0` (Badge/Active menu)
2. **Penggunaan Routing Ziggy**:
   - Selalu gunakan helper `route('nama.route', param)` untuk navigasi atau pengiriman form via Inertia. Jangan melakukan *hardcode* path URL.
3. **Pengelolaan State & Formulir**:
   - Gunakan `useForm` dari `@inertiajs/react` untuk form yang memiliki file upload atau mutasi standar.
   - Tangkap flash messages dari props:
     ```jsx
     const { flash, errors, auth } = usePage().props;
     // flash.success, flash.error
     ```
4. **Struktur Komponen**:
   - Simpan halaman pada direktori `resources/js/Pages/<Modul>/Index.jsx`.
   - Sub-komponen spesifik modul disimpan di folder `resources/js/Pages/<Modul>/Components/`.
   - Komponen global umum (Modal, Button, Input) berada di `resources/js/Components/`.

### C. Alur Kerja Git & Komitmen
- Gunakan format *Conventional Commits*:
  - `feat(...)`: Fitur baru (misal: `feat(pos): integrasi metode pembayaran QRIS dinamis`)
  - `fix(...)`: Perbaikan bug (misal: `fix(inventory): perbaiki kalkulasi sisa stok batch FEFO`)
  - `refactor(...)`: Restrukturisasi kode tanpa mengubah fungsionalitas
  - `docs(...)`: Dokumentasi

---

## 8. Panduan Perintah Operasional (CLI Cheatsheet)

### Menjalankan Lingkungan Pengembangan
```bash
# Menjalankan server Laravel & Vite secara bersamaan (via Composer script)
composer run dev

# Atau menjalankan manual terpisah di dua terminal:
php artisan serve
npm run dev
```

### Database & Migrasi
```bash
# Menjalankan migrasi baru
php artisan migrate

# Menjalankan seeder master dasar (Role, Cabang, BPOM Categories)
php artisan db:seed --class=DatabaseSeeder

# Menghapus & membuat ulang skema database (HATI-HATI di mode produksi!)
php artisan migrate:fresh --seed
```

### Optimalisasi & Maintenance Cache
```bash
# Membersihkan seluruh cache konfigurasi, rute, dan view
php artisan optimize:clear

# Memeriksa daftar rute aktif
php artisan route:list
```

### Build Aset Frontend Produksi
```bash
npm run build
```

---

*Panduan ini dibuat dan dipelihara secara otomatis untuk menjaga integritas standar teknis MediSync.*
