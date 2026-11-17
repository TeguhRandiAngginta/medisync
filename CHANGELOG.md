# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).
Perubahan di bawah ini dicatat pada branch `ditz`.

## [Unreleased] - 2026-11-17

### Added
- `Dockerfile` multi-stage: build aset (Node 20), dependency PHP (Composer, tanpa dev), PHP 8.3-FPM (`app`), dan Nginx (`web`).
- `docker-compose.yml` dengan 4 service: `app` (PHP-FPM + auto-migrate), `queue` (`queue:work`), `web` (Nginx, port `APP_PORT`, default 8080), `db` (PostgreSQL 16).
- `docker/entrypoint.sh` (cek `APP_KEY`, `storage:link`, migrate opsional, cache config/route/view), `docker/nginx/default.conf`, `docker/php.ini` (upload 20M, timeout 150 dtk).
- `.dockerignore` dan `.env.docker.example` (template `.env` untuk Docker).
- Volume `storage` dibagi ke `web` (read-only) untuk file di `storage/app/public`. Lampiran resep sudah tidak memakainya (lihat Fixed).

### Fixed
- Migrasi gagal di database kosong: `create_stock_adjustments_table` membuat FK ke `product_batches` sebelum tabel itu ada. File diganti nama dari `2026_11_02_000001_...` menjadi `2026_11_06_052211_...` dan diberi guard `Schema::hasTable` agar database lama yang sudah menjalankan migrasi tidak error.
- Batch kedaluwarsa tidak lagi terjual: `InventoryService::deductStockFEFO` melewati batch dengan `expired_date` sebelum hari ini. Parameter baru `$includeExpired` hanya dipakai `Sale::restored` agar transaksi lama tetap bisa dipulihkan dari batch yang dulu masih valid.
- Stok tidak lagi membengkak saat transaksi dihapus-dipulihkan-dihapus: `recordSaleDetailBatches` kini mengganti (bukan menambah) baris `sale_detail_batches`.
- Pemulihan transaksi dengan stok tidak cukup kini menampilkan pesan error (sebelumnya exception tidak tertangkap, 500) di `SalesHistoryController::restore` dan `bulkRestore`.
- POS (`PosController::store`) tidak lagi memercayai data klien: harga diambil dari `medicines.selling_price`, kembalian dihitung di server, pembayaran kurang dari total ditolak, dan obat yang tidak ada/nonaktif ditolak. Nomor invoice memakai `random_int(1000, 9999)` (tabrakan di detik yang sama masih mungkin, tetapi kolom unik sehingga transaksi gagal, bukan duplikat).
- Akun nonaktif langsung kehilangan akses: middleware baru `EnsureUserIsActive` (didaftarkan di grup `web`) melogout sesi atau cookie remember-me yang sudah terbuka.
- `ProfileController::destroy` menolak hapus akun sendiri bila akun punya riwayat penjualan, pembelian, atau shift (sama seperti `UserController::destroy`), dan tidak lagi logout lebih dulu.
- Item resep lama hasil edit tidak hidup lagi saat resep dipulihkan dari trash: `PrescriptionController::update` memakai `forceDelete` untuk item yang diganti.
- Kunci API Gemini tidak lagi bocor lewat pesan error: `GoogleAIService` menyamarkan key (`[REDACTED]`) di pesan exception dan log. Model dari `GEMINI_MODEL` kini dicoba lebih dulu.
- Struk POS tidak lagi `INV-SUCCESS`: `HandleInertiaRequests` membagikan `flash.invoice_number` ke UI.
- Resep: hapus, pulihkan, dan hapus permanen (termasuk bulk) kini hanya untuk superadmin dan apoteker (sebelumnya kasir bisa). Resep berstatus DISPENSED tidak bisa dipindahkan ke trash. Hapus permanen juga menghapus file lampirannya dari disk.
- `SupplierController::store/update` memvalidasi `code` unik termasuk data di trash (sesuai unique index DB), sehingga tidak lagi berakhir 500. `quickStore` supplier dan obat serta `RackController::store` mengubah kode ke huruf besar sebelum validasi.
- OCR resep (`PrescriptionController::analyzeImage`) tidak lagi menebak obat: nama dan dosis dipisah, dosis di resep harus cocok dengan stok, nama yang cocok dengan beberapa obat (mis. Paracetamol 500mg dan 650mg) tidak dipilih otomatis melainkan dimasukkan ke catatan peringatan beserta pilihannya, nama persis diprioritaskan, dan karakter `%`/`_` dari OCR di-escape agar tidak menjadi wildcard. Validasi upload yang gagal kini mengembalikan 422, bukan 500.
- Stock opname: membatalkan atau memulihkan catatan opname kini ditolak (dengan pesan jelas) bila stok batch sudah berubah sehingga hasilnya negatif, atau bila batch sudah tidak ada (mis. faktur pembeliannya di trash). Sebelumnya stok dipaksa ke 0 lewat `max(0, ...)` sehingga selisih hilang diam-diam dan catatan tetap dianggap berhasil dibatalkan. Pembatalan massal bersifat semua-atau-tidak sama sekali.
- Stock opname baru ditolak bila selisih 0, atau bila tipe `DAMAGE`/`EXPIRED`/`LOST` justru menambah stok (gunakan `CORRECTION`).
- Kartu stok (`ReportController::generateStockLedger`) kini mencakup penyesuaian stock opname (IN/OUT sesuai tanda selisih) selain pembelian dan penjualan, menghitung saldo awal dari semua mutasi sebelum periode, dan menampilkan saldo sebelum/sesudah tiap mutasi (kolom "Saldo Stok" di UI). Transaksi yang dibatalkan (penjualan, faktur, opname di trash) tidak dihitung sehingga saldo akhir selalu sama dengan stok obat. Nama obat tidak lagi jatuh ke "Obat" untuk obat yang di-soft-delete.
- Export kartu stok (Excel/cetak, `type=mutations`) sebelumnya kosong karena template tidak punya kolom/baris untuk tipe itu; kini menampilkan seluruh mutasi beserta saldo.
- `PurchaseController::store` gagal ("Undefined array key notes") bila field `notes` tidak dikirim; kini `notes` opsional.
- Export "Laporan Stok Kritis" kini menampilkan stok sebenarnya (`medicines.stock`), bukan kolom legacy `current_stock` yang tidak pernah diperbarui.
- Aturan stok rendah diseragamkan lewat scope `Medicine::lowStock()` (obat aktif dengan `stock <= min_stock`) dan dipakai di laporan (ringkasan dan export), dashboard (jumlah dan daftar), serta `AlertService`. Sebelumnya laporan memakai ambang tetap 10 dan jumlah di dashboard tidak memfilter obat nonaktif.
- Export "Laporan Laba Rugi" memakai HPP riil dari `sale_details.purchase_price` lewat `ReportController::saleHpp()` yang juga dipakai halaman laporan, sehingga laba export sama dengan di layar (sebelumnya `selling_price * 0.7`). Export tidak lagi error 500 bila ada obat yang sudah di-trash.
- Dashboard: data penjualan seluruh toko (omzet hari ini, grafik, produk terlaris, distribusi pembayaran, transaksi terbaru) kini hanya untuk superadmin, sama seperti halaman Laporan. Kasir dan apoteker hanya melihat transaksi miliknya sendiri; UI menampilkan keterangan "Ringkasan transaksi Anda sendiri" lewat prop `scope`. Peringatan stok rendah dan kedaluwarsa tetap tampil untuk semua peran. Sebelumnya kasir bisa melihat omzet seluruh toko.
- Riwayat penjualan (`SalesHistoryController`): kasir dan apoteker hanya melihat transaksinya sendiri, tab Trash (dan `sales.trash`) hanya untuk superadmin/owner (selain itu 403), jumlah trash disembunyikan, dan tombol tab Trash tidak ditampilkan di UI (prop `canManage`).
- Lampiran resep (data medis pasien) tidak lagi dilayani tanpa login lewat `/storage/...`: file baru disimpan di disk privat `local` dan dibuka lewat route berotorisasi `GET /prescriptions/{prescription}/attachment` (`prescriptions.attachment`, wajib login dengan peran superadmin/apoteker/kasir, header `X-Content-Type-Options: nosniff`). Lampiran lama di disk `public` tetap bisa dibuka lewat route yang sama sebagai cadangan. Tautan di halaman Resep mengarah ke route baru. Command baru `php artisan prescriptions:secure-attachments` memindahkan lampiran lama ke disk privat. Hapus permanen resep menghapus file dari kedua disk.
- Test regresi baru: `tests/Feature/BugfixRegressionTest.php` (20 test), `tests/Feature/StockLedgerTest.php` (4 test), `tests/Feature/ReportExportTest.php` (3 test), `tests/Feature/DashboardScopeTest.php` (3 test), `tests/Feature/SalesHistoryScopeTest.php` (4 test), `tests/Feature/PrescriptionAttachmentSecurityTest.php` (6 test), dan `tests/Feature/PrescriptionOcrMatchingTest.php` (7 test, butuh PostgreSQL karena memakai `ilike`; dilewati di SQLite). Pada kode lama, test yang menguji perilaku baru gagal. Seluruh suite: 92 test lulus di PostgreSQL, dan di SQLite 85 lulus + 7 dilewati.

**Catatan data lama:** item resep versi lama yang sudah terlanjur berstatus soft-deleted di database bisa tetap muncul saat resep dipulihkan; perbaikan hanya berlaku untuk edit berikutnya. Juga, perbaikan stok membengkak hanya berlaku untuk transaksi yang diproses setelah ini. Transaksi yang sudah pernah dihapus lalu dipulihkan pada kode lama bisa masih punya baris ganda di `sale_detail_batches`, sehingga menghapusnya lagi tetap mengembalikan stok dua kali. Cek dengan: `SELECT sale_detail_id FROM sale_detail_batches b JOIN sale_details d ON d.id = b.sale_detail_id GROUP BY sale_detail_id, d.quantity HAVING SUM(b.quantity) > d.quantity;`. Migrasi pembersih belum dibuat.

### Cara menjalankan (Docker)
1. `cp .env.docker.example .env`, lalu isi `DB_PASSWORD` dan `GEMINI_API_KEY`.
2. Buat key: `docker compose run --rm --no-deps -e APP_KEY=base64:placeholder app php artisan key:generate --show`, lalu tempel hasilnya ke `APP_KEY=` di `.env`.
3. `docker compose up -d --build`, lalu `docker compose exec app php artisan db:seed --force` (`--force` wajib karena `APP_ENV=production`).
4. Login `admin@medisync.com` / `password` (ganti segera).

### Catatan

**Perubahan perilaku yang perlu diketahui tim**
- Omzet, grafik, produk terlaris, dan riwayat penjualan seluruh toko kini hanya untuk superadmin. Apoteker saya samakan dengan kasir (hanya data sendiri) karena halaman Laporan pun tidak terbuka untuk apoteker. Bila apoteker perlu melihat omzet toko, tambahkan perannya di `DashboardController` dan `SalesHistoryController`.
- Peran `owner` disebut di `SalePolicy` dan `checkOwnerAccess`, tetapi seeder hanya membuat superadmin, apoteker, dan kasir. Praktis hanya superadmin yang bisa menghapus/memulihkan transaksi dan faktur.
- Batch kedaluwarsa tidak lagi dijual oleh kasir. Stok "tersedia" kini hanya menghitung batch yang belum kedaluwarsa, jadi penjualan bisa ditolak walau `medicines.stock` (yang menjumlahkan semua batch) masih positif. Hapus batch kedaluwarsa lewat opname bertipe `EXPIRED`.
- Pembatalan atau pemulihan stock opname ditolak bila stok batch sudah berubah sampai hasilnya negatif. Solusinya membuat opname koreksi baru, bukan membatalkan yang lama.
- Obat hasil OCR resep yang ambigu (beberapa kekuatan/varian) tidak dipilih otomatis. Apoteker memilih manual dari daftar pada catatan peringatan.
- Laporan stok kritis kini mengikuti `min_stock` tiap obat (bukan angka tetap 10). Obat dengan `min_stock = 0` (default kolom) baru dianggap kritis saat stoknya habis; isi `min_stock` di master obat bila perlu.
- Laba pada export laba rugi kini memakai HPP riil dan sama dengan di layar. Laporan lama yang sudah dicetak (rumus 70% harga jual) tidak akan cocok dengan export baru.
- Harga di POS selalu diambil dari master obat; perubahan harga oleh klien diabaikan. Kembalian dihitung server dan pembayaran kurang ditolak.

**Data lama (tidak otomatis diperbaiki)**
- **Wajib dijalankan sekali di setiap lingkungan yang sudah punya lampiran resep:** `php artisan prescriptions:secure-attachments` (di Docker: `docker compose exec app php artisan prescriptions:secure-attachments`). Selama belum dijalankan, lampiran lama masih bisa dibuka tanpa login lewat `/storage/prescriptions/...`. Sudah diuji di stack Docker: sebelum command `/storage/...` mengembalikan 200, sesudahnya 404, dan route lampiran tanpa login dialihkan ke `/login`.
- `stock_adjustments`: migrasi diganti nama; database yang sudah ada tetap aman karena ada guard `Schema::hasTable`.
- Transaksi yang pernah dihapus lalu dipulihkan pada kode lama bisa punya baris ganda di `sale_detail_batches`; query pengecekan ada pada catatan di bawah Fixed. Migrasi pembersih belum dibuat.
- Item resep versi lama yang sudah soft-deleted di database bisa muncul lagi saat resep dipulihkan; perbaikan hanya berlaku untuk edit berikutnya.
- Opname lama yang dulu dipaksa ke 0 oleh `max(0, ...)` tidak bisa dipulihkan otomatis dan perlu dicek manual.
- Kartu stok mengandaikan stok berasal dari pembelian, penjualan, dan opname. Stok awal atau perubahan stok di luar ketiganya tidak tercatat sehingga saldonya bisa berbeda dari stok nyata untuk data semacam itu.

**Operasional Docker**
- Setelah container `app` dibuat ulang, jalankan `docker compose restart web` (atau `up -d --force-recreate web`); bila tidak, Nginx masih mengarah ke IP lama dan mengembalikan 502.
- Setelah restart Docker Desktop, port yang dipublikasikan bisa hilang; `docker compose up -d --force-recreate web` memulihkannya.
- Port 8080 di mesin pengembangan sudah dipakai; `.env` lokal memakai `APP_PORT=8081`.
- Ganti password admin bawaan (`admin@medisync.com` / `password`) dan `DB_PASSWORD` sebelum dipakai di luar mesin lokal. `.env` di-gitignore.
- `bootstrap/cache/*.php` sengaja masuk `.dockerignore`: cache paket hasil `composer install` dengan dependensi dev (mis. Pail) membuat container produksi crash.

**Menjalankan test**
- PHP lokal (7.4) tidak bisa dipakai; test dijalankan di dalam container PHP 8.3 dari image proyek dengan folder proyek dimount.
- Test yang merender halaman Inertia butuh `public/build/manifest.json` hasil build asli (stub manifest tidak cukup).
- `PrescriptionOcrMatchingTest` butuh PostgreSQL (operator `ilike`). Buat database `medisync_test` di container `db`, lalu jalankan dengan `DB_CONNECTION=pgsql` dan jaringan compose; di SQLite test ini dilewati. Seluruh suite lulus di kedua database.

**Batas verifikasi**
- Semua temuan dan perbaikan bersumber dari membaca kode dan test otomatis; belum ada uji manual di browser. Perubahan UI sangat kecil (kolom "Saldo Stok", subjudul dashboard, tab Trash) dan build frontend berhasil.
- Frontend `resources/js` hanya dibaca pada bagian yang diubah.

### Known issues (hasil screening, belum diperbaiki)
Tag **[V]** = terlihat jelas dari membaca kode, **[?]** = perlu dicek/direproduksi.
Cakupan: controller dan service domain sudah dibaca (`Pos`, `CashRegister`, `Purchase`, `SalesHistory`, `Prescription`, `StockAdjustment`, `Product`, `Supplier`, `Rack`, `Report`, `Dashboard`, `AuditLog`, `User`, `Profile`, `RegisteredUser`, `InventoryService`, `AlertService`, `GoogleAIService`), model inti, dan routes.
`ReferenceController` hanya dibaca ±200 dari 584 baris (struktur tiap blok sama, guard hapus permanen dicek lewat grep). **Belum dibaca:** seluruh frontend `resources/js`, controller auth bawaan Breeze (`routes/auth.php` hanya dilihat, kecuali `RegisteredUser`), `ReportExport`, dan view Blade. `HandleInertiaRequests` sudah dibaca: key flash `success` dan `error` dibagikan ke UI. Semua temuan di sini murni dari membaca kode, belum ada yang direproduksi lewat uji jalan.

**Tinggi**

**Sedang**
- **[V]** `GoogleAIService`: daftar model fallback di-hardcode dan dicoba berurutan, tiap kegagalan menghabiskan timeout 25 dtk (hingga ±125 dtk).
- **[?]** Nama model `gemini-3.8-flash` dan `gemini-1.5-*` perlu dicocokkan dengan daftar model Gemini yang berlaku.
- **[V]** Nomor resep `RSP-Ymd-mt_rand(1,999)` di `PrescriptionController::store` rawan bentrok. Kolom `prescription_number` unik, jadi bentrok menghasilkan pesan gagal simpan.
- **[?]** `smartSearch`: bila AI mengembalikan objek bersarang, `$keywords` berisi array dan query menjadi `ilike '%Array%'`.
- **[?]** `openShift` tidak punya kunci atau unique constraint, klik ganda cepat bisa membuat dua shift terbuka.
- **[V]** `PurchaseController::store` mewajibkan `expired_date >= 6 bulan ke depan`, sehingga barang dengan sisa umur lebih pendek tidak bisa dicatat.
- **[V]** Lampiran resep dibatasi 2 MB (`max:2048`), sedangkan `analyzeImage` menerima 5 MB. Foto ponsel mudah melewati batas.
- **[V]** `RackController::update` memakai `'is_active' => $request->is_active ?? false`; bila field tidak terkirim, rak dinonaktifkan diam-diam (berbeda dari `SupplierController`).
- **[V]** `ProductController::forceDelete` dan `bulkForceDelete` tidak memeriksa `PrescriptionItem`. Hasilnya bergantung pada FK: error 500 atau item resep ikut hilang.
- **[V]** `AuditLogController::index` memuat seluruh log per tab tanpa paginasi, begitu juga `ReportController::index` (semua penjualan beserta detail dan `monthSales`) dan `ProductController::index`. Memori dan waktu respons tumbuh seiring data.

**Rendah**
- **[V]** Peran `owner` tidak pernah dibuat seeder, padahal `SalePolicy` dan `checkOwnerAccess` menyebutnya. Hanya superadmin yang bisa menghapus.
- **[?]** Parsing `payment_method` split di `CashRegisterController::closeShift` rapuh untuk nominal desimal.
- **[V]** `Medicine.stock` (`syncMedicineStock`) menjumlahkan semua batch termasuk kedaluwarsa, sedangkan POS mengecualikannya, sehingga angka stok berbeda antar halaman.
- **[V]** `PrescriptionController::index` dan `StockAdjustmentController::create` memuat semua data tanpa paginasi.
- **[V]** `ProductController::bulkDestroy/bulkRestore` tidak memvalidasi `ids`, dan pesan `bulkRestore` memakai `count($ids)` alih-alih jumlah yang benar-benar dipulihkan.
- **[?]** Distribusi pembayaran di dashboard mengelompokkan per string `payment_method`; pembayaran split ("Cash: 50000 + QRIS: 25000") menjadi bucket tersendiri per kombinasi nominal.
- **[V]** `ReportController::profitLoss` tidak punya route (kode mati) dan memakai `created_at`, bukan `sale_date`.
- **[V]** Parameter tanggal laporan tidak divalidasi; nilai tidak valid memicu exception `Carbon::parse` (500).
- **[V]** `RackController::store` memakai fallback `branch_id ?? 1` yang di-hardcode.
- **[?]** Soft delete kategori obat atau tipe referensi yang masih dipakai diizinkan, sehingga relasinya bernilai null di UI.
- **[V]** Route `pos.receipt` (`GET /pos/receipt/{invoice}`) menunjuk ke `PosController::printReceipt` yang tidak ada (view `pos/receipt-pdf.blade.php` sudah ada tetapi tidak dipakai); memanggil route itu menghasilkan error 500. Tidak dipakai oleh frontend saat ini.
