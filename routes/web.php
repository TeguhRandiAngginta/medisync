<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SalesHistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PrescriptionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

// Akses Dasar untuk Semua User yang Sudah Login
Route::middleware(['auth', 'verified'])->group(function () {
    // Rute Dashboard (Wajib ada agar Ziggy tidak error)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // POS & Penjualan (Bisa diakses Superadmin, Apoteker, dan Kasir)
    // Menggunakan middleware auth biasa agar tidak bentrok dengan string role_id database
    Route::get('/pos', [App\Http\Controllers\PosController::class, 'index'])->name('pos.index');
    Route::post('/pos', [App\Http\Controllers\PosController::class, 'store'])->name('pos.store');
    Route::get('/pos/receipt/{invoice}', [App\Http\Controllers\PosController::class, 'printReceipt'])->name('pos.receipt');
    
    // Sales History & Bulk Actions
    Route::get('/sales-history', [SalesHistoryController::class, 'index'])->name('sales.history');
    Route::get('/sales-history/trash', [SalesHistoryController::class, 'trash'])->name('sales.trash');
    Route::delete('/sales-history/{id}', [SalesHistoryController::class, 'destroy'])->name('sales.destroy');
    Route::post('/sales-history/{id}/restore', [SalesHistoryController::class, 'restore'])->name('sales.restore');
    Route::delete('/sales-history/{id}/force-delete', [SalesHistoryController::class, 'forceDelete'])->name('sales.force-delete');
    Route::post('/sales/bulk-destroy', [SalesHistoryController::class, 'bulkDestroy'])->name('sales.bulk-destroy');
    Route::post('/sales/bulk-restore', [SalesHistoryController::class, 'bulkRestore'])->name('sales.bulk-restore');
    
    // Prescriptions & OCR
    Route::post('/api/prescriptions/analyze', [PrescriptionController::class, 'analyzeImage'])->middleware('throttle:10,1')->name('api.prescriptions.analyze');
    Route::get('/api/prescriptions/{number}', [PrescriptionController::class, 'getForPos'])->name('api.prescriptions.get');
    Route::resource('prescriptions', PrescriptionController::class)->except(['show', 'edit', 'update']);
    Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit');
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update');
});

// Akses Terbatas (Pembelian, Produk, Supplier, Batch FEFO)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('purchases/trash', [PurchaseController::class, 'trash'])->name('purchases.trash');
    Route::post('purchases/{id}/restore', [PurchaseController::class, 'restore'])->name('purchases.restore');
    Route::delete('purchases/{id}/force-delete', [PurchaseController::class, 'forceDelete'])->name('purchases.force-delete');
    Route::get('purchases/{purchase}/print', [PurchaseController::class, 'printPdf'])->name('purchases.print');

    Route::resource('purchases', PurchaseController::class);

    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::resource('products', ProductController::class);

    Route::resource('suppliers', App\Http\Controllers\SupplierController::class);
    Route::resource('racks', App\Http\Controllers\RackController::class);

    Route::get('/product-batches', [PurchaseController::class, 'batchesIndex'])->name('batches.index');

    Route::resource('stock-adjustments', App\Http\Controllers\StockAdjustmentController::class)->only(['index', 'create', 'store']);
});

// Akses Absolut / Eksekutif (Laporan, Audit, Manajemen User)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('/audit-logs', [App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::get('/references', [App\Http\Controllers\ReferenceController::class, 'index'])->name('references.index');
    Route::post('/references/location-types', [App\Http\Controllers\ReferenceController::class, 'storeLocationType'])->name('references.location-types.store');
    Route::put('/references/location-types/{locationType}', [App\Http\Controllers\ReferenceController::class, 'updateLocationType'])->name('references.location-types.update');
    Route::delete('/references/location-types/{locationType}', [App\Http\Controllers\ReferenceController::class, 'destroyLocationType'])->name('references.location-types.destroy');

    Route::post('/references/supplier-types', [App\Http\Controllers\ReferenceController::class, 'storeSupplierType'])->name('references.supplier-types.store');
    Route::put('/references/supplier-types/{supplierType}', [App\Http\Controllers\ReferenceController::class, 'updateSupplierType'])->name('references.supplier-types.update');
    Route::delete('/references/supplier-types/{supplierType}', [App\Http\Controllers\ReferenceController::class, 'destroySupplierType'])->name('references.supplier-types.destroy');

    Route::post('/references/medicine-categories', [App\Http\Controllers\ReferenceController::class, 'storeMedicineCategory'])->name('references.medicine-categories.store');
    Route::put('/references/medicine-categories/{medicineCategory}', [App\Http\Controllers\ReferenceController::class, 'updateMedicineCategory'])->name('references.medicine-categories.update');
    Route::delete('/references/medicine-categories/{medicineCategory}', [App\Http\Controllers\ReferenceController::class, 'destroyMedicineCategory'])->name('references.medicine-categories.destroy');

    Route::resource('users', App\Http\Controllers\UserController::class);
});

require __DIR__.'/auth.php';