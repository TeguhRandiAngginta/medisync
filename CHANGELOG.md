# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).
Perubahan di bawah ini dicatat pada branch `ditz`.

## [Unreleased] - 2026-11-17

### Added
- `Dockerfile` multi-stage: build aset (Node 20), dependency PHP (Composer, tanpa dev), PHP 8.3-FPM (`app`), dan Nginx (`web`).
- `docker-compose.yml` dengan 4 service: `app` (PHP-FPM + auto-migrate), `queue` (`queue:work`), `web` (Nginx, port `APP_PORT`, default 8080), `db` (PostgreSQL 16).
- `docker/entrypoint.sh` (cek `APP_KEY`, `storage:link`, migrate opsional, cache config/route/view), `docker/nginx/default.conf`, `docker/php.ini` (upload 20M, timeout 150 dtk).
- `.dockerignore` dan `.env.docker.example` (template `.env` untuk Docker).
- Volume `storage` dibagi ke `web` agar lampiran resep (`/storage/prescriptions/...`) bisa diakses.

### Fixed
- Migrasi gagal di database kosong: `create_stock_adjustments_table` membuat FK ke `product_batches` sebelum tabel itu ada. File diganti nama dari `2026_11_02_000001_...` menjadi `2026_11_06_052211_...` dan diberi guard `Schema::hasTable` agar database lama yang sudah menjalankan migrasi tidak error.
- Batch kedaluwarsa tidak lagi terjual: `InventoryService::deductStockFEFO` melewati batch dengan `expired_date` sebelum hari ini. Parameter baru `$includeExpired` hanya dipakai `Sale::restored` agar transaksi lama tetap bisa dipulihkan dari batch yang dulu masih valid.
- Stok tidak lagi membengkak saat transaksi dihapus-dipulihkan-dihapus: `recordSaleDetailBatches` kini mengganti (bukan menambah) baris `sale_detail_batches`.
- Pemulihan transaksi dengan stok tidak cukup kini menampilkan pesan error (sebelumnya exception tidak tertangkap, 500) di `SalesHistoryController::restore` dan `bulkRestore`.
- POS (`PosController::store`) tidak lagi memercayai data klien: harga diambil dari `medicines.selling_price`, kembalian dihitung di server, pembayaran kurang dari total ditolak, dan obat yang tidak ada/nonaktif ditolak. Nomor invoice memakai `random_int(1000, 9999)` (tabrakan di detik yang sama masih mungkin, tetapi kolom unik sehingga transaksi gagal, bukan duplikat).
- Test regresi baru: `tests/Feature/BugfixRegressionTest.php` (5 test; semuanya gagal pada kode lama dan lulus pada kode baru). Seluruh suite: 50 test lulus.

**Catatan data lama:** perbaikan stok membengkak hanya berlaku untuk transaksi yang diproses setelah ini. Transaksi yang sudah pernah dihapus lalu dipulihkan pada kode lama bisa masih punya baris ganda di `sale_detail_batches`, sehingga menghapusnya lagi tetap mengembalikan stok dua kali. Cek dengan: `SELECT sale_detail_id FROM sale_detail_batches b JOIN sale_details d ON d.id = b.sale_detail_id GROUP BY sale_detail_id, d.quantity HAVING SUM(b.quantity) > d.quantity;`. Migrasi pembersih belum dibuat.

### Cara menjalankan (Docker)
1. `cp .env.docker.example .env`, lalu isi `DB_PASSWORD` dan `GEMINI_API_KEY`.
2. Buat key: `docker compose run --rm --no-deps -e APP_KEY=base64:placeholder app php artisan key:generate --show`, lalu tempel hasilnya ke `APP_KEY=` di `.env`.
3. `docker compose up -d --build`, lalu `docker compose exec app php artisan db:seed --force` (`--force` wajib karena `APP_ENV=production`).
4. Login `admin@medisync.com` / `password` (ganti segera).

### Known issues (hasil screening, belum diperbaiki)
Tag **[V]** = terlihat jelas dari membaca kode, **[?]** = perlu dicek/direproduksi.
Cakupan: controller dan service domain sudah dibaca (`Pos`, `CashRegister`, `Purchase`, `SalesHistory`, `Prescription`, `StockAdjustment`, `Product`, `Supplier`, `Rack`, `Report`, `Dashboard`, `AuditLog`, `User`, `Profile`, `RegisteredUser`, `InventoryService`, `AlertService`, `GoogleAIService`), model inti, dan routes.
`ReferenceController` hanya dibaca ±200 dari 584 baris (struktur tiap blok sama, guard hapus permanen dicek lewat grep). **Belum dibaca:** seluruh frontend `resources/js`, controller auth bawaan Breeze (`routes/auth.php` hanya dilihat, kecuali `RegisteredUser`), `ReportExport`, dan view Blade. `HandleInertiaRequests` sudah dibaca: key flash `success` dan `error` dibagikan ke UI. Semua temuan di sini murni dari membaca kode, belum ada yang direproduksi lewat uji jalan.

**Tinggi**
- **[V]** `ProfileController::destroy` memungkinkan user menghapus akunnya sendiri, melewati proteksi riwayat di `UserController::destroy`. User tanpa SoftDeletes dan punya transaksi kena error FK setelah logout.
- **[V]** `PrescriptionController::update` menghapus item secara soft delete, lalu `restore`/`bulkRestore` memulihkan semua item terhapus milik resep itu, termasuk versi lama hasil edit. Item resep jadi dobel atau usang.
- **[V]** Pencocokan obat di `analyzeImage` memakai `ilike '%nama%'->first()` tanpa urutan. Obat dengan dosis berbeda bisa tertukar dan dimasukkan ke resep.

**Sedang**
- **[V]** Akun nonaktif tetap memakai sesi atau cookie remember-me yang sudah ada (`is_active` hanya dicek saat login).
- **[?]** Kunci API Gemini ada di query string URL. `scanInvoice` dan `analyzeImage` mengembalikan `$e->getMessage()` ke klien, yang bisa memuat URL lengkap.
- **[V]** `GoogleAIService`: daftar model di-hardcode dan dicoba berurutan, tiap kegagalan menghabiskan timeout 25 dtk (hingga ±125 dtk). Config `GEMINI_MODEL` tidak dipakai.
- **[?]** Nama model `gemini-3.8-flash` dan `gemini-1.5-*` perlu dicocokkan dengan daftar model Gemini yang berlaku.
- **[V]** Lampiran resep disimpan di disk `public` dan dilayani tanpa login. Nama file acak (tidak bisa ditebak), tetapi URL yang bocor tidak bisa dicabut, dan file tidak dihapus saat resep dihapus permanen. Data medis pasien.
- **[V]** Rute resep (hapus, restore, hapus permanen, ubah) bisa diakses kasir karena hanya dibatasi `role:superadmin,apoteker,kasir` tanpa pengecekan di controller. `destroy` juga boleh menghapus resep berstatus DISPENSED.
- **[V]** `StockAdjustmentController`: membatalkan atau memulihkan opname mengurangi atau menambah `difference` pada stok saat ini dengan `max(0, ...)`. Kalau stok sudah berubah setelah opname, hasilnya salah dan selisih hilang diam-diam.
- **[V]** `type` opname (`DAMAGE`, `EXPIRED`, `LOST`) tidak divalidasi terhadap tanda selisih, sehingga "rusak" bisa menambah stok. Selisih 0 tetap dicatat.
- **[V]** Nomor resep `RSP-Ymd-mt_rand(1,999)` di `PrescriptionController::store` rawan bentrok. Kolom `prescription_number` unik, jadi bentrok menghasilkan pesan gagal simpan.
- **[V]** `PosController::store` mem-flash `invoice_number`, tetapi `HandleInertiaRequests::share()` hanya membagikan `success` dan `error`. Akibatnya `page.props.flash?.invoice_number` di `Pos/Index.jsx` selalu kosong dan struk menampilkan `INV-SUCCESS`, sehingga rute `/pos/receipt/{invoice}` tidak bisa dipakai dari struk.
- **[?]** `smartSearch`: bila AI mengembalikan objek bersarang, `$keywords` berisi array dan query menjadi `ilike '%Array%'`.
- **[?]** `openShift` tidak punya kunci atau unique constraint, klik ganda cepat bisa membuat dua shift terbuka.
- **[V]** `PurchaseController::store` mewajibkan `expired_date >= 6 bulan ke depan`, sehingga barang dengan sisa umur lebih pendek tidak bisa dicatat.
- **[V]** Lampiran resep dibatasi 2 MB (`max:2048`), sedangkan `analyzeImage` menerima 5 MB. Foto ponsel mudah melewati batas.
- **[V]** `suppliers.code` unik di level DB, tetapi validasi `SupplierController::store/update` hanya memeriksa `whereNull('deleted_at')`. Kode yang sama dengan pemasok di trash lolos validasi lalu gagal dengan error DB (500). `quickStore` sebaliknya memakai `unique` termasuk trash.
- **[V]** `ReportController::generateStockLedger` (kartu stok) hanya memuat pembelian (IN) dan penjualan (OUT). Penyesuaian opname dan pembatalan/pemulihan transaksi tidak tercatat dan tidak ada saldo awal, jadi kartu stok tidak cocok dengan stok.
- **[V]** `RackController::update` memakai `'is_active' => $request->is_active ?? false`; bila field tidak terkirim, rak dinonaktifkan diam-diam (berbeda dari `SupplierController`).
- **[V]** `ProductController::forceDelete` dan `bulkForceDelete` tidak memeriksa `PrescriptionItem`. Hasilnya bergantung pada FK: error 500 atau item resep ikut hilang.
- **[V]** Dashboard (`/dashboard`) hanya dilindungi `auth` + `verified`, jadi kasir ikut melihat omzet, produk terlaris, distribusi pembayaran, dan transaksi terbaru.
- **[V]** `AuditLogController::index` memuat seluruh log per tab tanpa paginasi, begitu juga `ReportController::index` (semua penjualan beserta detail dan `monthSales`) dan `ProductController::index`. Memori dan waktu respons tumbuh seiring data.

**Rendah**
- **[V]** Peran `owner` tidak pernah dibuat seeder, padahal `SalePolicy` dan `checkOwnerAccess` menyebutnya. Hanya superadmin yang bisa menghapus.
- **[V]** Kasir bisa melihat seluruh riwayat penjualan dan tab trash.
- **[?]** Parsing `payment_method` split di `CashRegisterController::closeShift` rapuh untuk nominal desimal.
- **[V]** `Medicine.stock` (`syncMedicineStock`) menjumlahkan semua batch termasuk kedaluwarsa, sedangkan POS mengecualikannya, sehingga angka stok berbeda antar halaman.
- **[V]** `PrescriptionController::index` dan `StockAdjustmentController::create` memuat semua data tanpa paginasi.
- **[V]** `strtoupper` dilakukan setelah validasi unik pada `ProductController::quickStore` dan `RackController::store`, sehingga kode yang hanya beda huruf besar/kecil lolos validasi dan gagal di unique index DB (500).
- **[V]** `ProductController::bulkDestroy/bulkRestore` tidak memvalidasi `ids`, dan pesan `bulkRestore` memakai `count($ids)` alih-alih jumlah yang benar-benar dipulihkan.
- **[V]** Ambang stok rendah tidak konsisten: laporan memakai `stock <= 10` (hardcode), dashboard memakai `stock <= min_stock`. `lowStockCount` dashboard juga tidak memfilter `is_active`, berbeda dari daftarnya.
- **[?]** Distribusi pembayaran di dashboard mengelompokkan per string `payment_method`; pembayaran split ("Cash: 50000 + QRIS: 25000") menjadi bucket tersendiri per kombinasi nominal.
- **[V]** `ReportController::profitLoss` tidak punya route (kode mati) dan memakai `created_at`, bukan `sale_date`.
- **[V]** Parameter tanggal laporan tidak divalidasi; nilai tidak valid memicu exception `Carbon::parse` (500).
- **[V]** `RackController::store` memakai fallback `branch_id ?? 1` yang di-hardcode.
- **[?]** Soft delete kategori obat atau tipe referensi yang masih dipakai diizinkan, sehingga relasinya bernilai null di UI.
