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
});

// POS, Penjualan, & Resep (Bisa diakses Superadmin, Apoteker, dan Kasir)
Route::middleware(['auth', 'verified', 'role:superadmin,apoteker,kasir'])->group(function () {
    Route::get('/pos', [App\Http\Controllers\PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/shift/open', [App\Http\Controllers\CashRegisterController::class, 'openShift'])->name('pos.shift.open');
    Route::post('/pos/shift/close', [App\Http\Controllers\CashRegisterController::class, 'closeShift'])->name('pos.shift.close');
    Route::get('/api/pos/medicines', [App\Http\Controllers\PosController::class, 'searchMedicines'])->name('api.pos.medicines');
    Route::post('/api/pos/smart-search', [App\Http\Controllers\PosController::class, 'smartSearch'])->name('api.pos.smart-search');
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
    Route::post('/sales/bulk-force-delete', [SalesHistoryController::class, 'bulkForceDelete'])->name('sales.bulk-force-delete');
    
    // Prescriptions & OCR
    Route::post('/api/prescriptions/analyze', [PrescriptionController::class, 'analyzeImage'])->middleware('throttle:10,1')->name('api.prescriptions.analyze');
    Route::get('/api/prescriptions-drafts', [PrescriptionController::class, 'getDraftsForPos'])->name('api.prescriptions.drafts');
    Route::get('/api/prescriptions/{number}', [PrescriptionController::class, 'getForPos'])->name('api.prescriptions.get');
    Route::post('/prescriptions/bulk-destroy', [PrescriptionController::class, 'bulkDestroy'])->name('prescriptions.bulk-destroy');
    Route::post('/prescriptions/bulk-restore', [PrescriptionController::class, 'bulkRestore'])->name('prescriptions.bulk-restore');
    Route::post('/prescriptions/bulk-force-delete', [PrescriptionController::class, 'bulkForceDelete'])->name('prescriptions.bulk-force-delete');
    Route::post('/prescriptions/{id}/restore', [PrescriptionController::class, 'restore'])->name('prescriptions.restore');
    Route::delete('/prescriptions/{id}/force-delete', [PrescriptionController::class, 'forceDelete'])->name('prescriptions.force-delete');
    Route::resource('prescriptions', PrescriptionController::class)->except(['show', 'edit', 'update']);
    Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit');
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update');
});

// Akses Terbatas Inventaris & Pembelian (Superadmin & Apoteker)
Route::middleware(['auth', 'verified', 'role:superadmin,apoteker'])->group(function () {
    Route::get('purchases/trash', [PurchaseController::class, 'trash'])->name('purchases.trash');
    Route::post('purchases/{id}/restore', [PurchaseController::class, 'restore'])->name('purchases.restore');
    Route::delete('purchases/{id}/force-delete', [PurchaseController::class, 'forceDelete'])->name('purchases.force-delete');
    Route::get('purchases/{purchase}/print', [PurchaseController::class, 'printPdf'])->name('purchases.print');

    Route::post('/purchases/bulk-destroy', [PurchaseController::class, 'bulkDestroy'])->name('purchases.bulk-destroy');
    Route::post('/purchases/bulk-restore', [PurchaseController::class, 'bulkRestore'])->name('purchases.bulk-restore');
    Route::post('/purchases/bulk-force-delete', [PurchaseController::class, 'bulkForceDelete'])->name('purchases.bulk-force-delete');
    Route::post('/api/purchases/scan-invoice', [PurchaseController::class, 'scanInvoice'])->name('api.purchases.scan');
    Route::resource('purchases', PurchaseController::class);

    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/api/products/quick-store', [ProductController::class, 'quickStore'])->name('api.products.quick-store');
    Route::post('products/{id}/restore', [ProductController::class, 'restore'])->name('products.restore');
    Route::post('products/bulk-destroy', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');
    Route::post('products/bulk-restore', [ProductController::class, 'bulkRestore'])->name('products.bulk-restore');
    Route::post('products/bulk-force-delete', [ProductController::class, 'bulkForceDelete'])->name('products.bulk-force-delete');
    Route::delete('products/{id}/force-delete', [ProductController::class, 'forceDelete'])->name('products.force-delete');
    
    Route::resource('products', ProductController::class);

    Route::post('/api/suppliers/quick-store', [App\Http\Controllers\SupplierController::class, 'quickStore'])->name('api.suppliers.quick-store');
    Route::post('/suppliers/bulk-destroy', [App\Http\Controllers\SupplierController::class, 'bulkDestroy'])->name('suppliers.bulk-destroy');
    Route::post('/suppliers/bulk-restore', [App\Http\Controllers\SupplierController::class, 'bulkRestore'])->name('suppliers.bulk-restore');
    Route::post('/suppliers/bulk-force-delete', [App\Http\Controllers\SupplierController::class, 'bulkForceDelete'])->name('suppliers.bulk-force-delete');
    Route::post('/suppliers/{id}/restore', [App\Http\Controllers\SupplierController::class, 'restore'])->name('suppliers.restore');
    Route::delete('/suppliers/{id}/force-delete', [App\Http\Controllers\SupplierController::class, 'forceDelete'])->name('suppliers.force-delete');
    Route::resource('suppliers', App\Http\Controllers\SupplierController::class);

    Route::post('/racks/bulk-destroy', [App\Http\Controllers\RackController::class, 'bulkDestroy'])->name('racks.bulk-destroy');
    Route::post('/racks/bulk-restore', [App\Http\Controllers\RackController::class, 'bulkRestore'])->name('racks.bulk-restore');
    Route::post('/racks/bulk-force-delete', [App\Http\Controllers\RackController::class, 'bulkForceDelete'])->name('racks.bulk-force-delete');
    Route::post('/racks/{id}/restore', [App\Http\Controllers\RackController::class, 'restore'])->name('racks.restore');
    Route::delete('/racks/{id}/force-delete', [App\Http\Controllers\RackController::class, 'forceDelete'])->name('racks.force-delete');
    Route::resource('racks', App\Http\Controllers\RackController::class);

    Route::get('/product-batches', [PurchaseController::class, 'batchesIndex'])->name('batches.index');

    Route::post('/stock-adjustments/bulk-destroy', [App\Http\Controllers\StockAdjustmentController::class, 'bulkDestroy'])->name('stock-adjustments.bulk-destroy');
    Route::post('/stock-adjustments/bulk-restore', [App\Http\Controllers\StockAdjustmentController::class, 'bulkRestore'])->name('stock-adjustments.bulk-restore');
    Route::post('/stock-adjustments/bulk-force-delete', [App\Http\Controllers\StockAdjustmentController::class, 'bulkForceDelete'])->name('stock-adjustments.bulk-force-delete');
    Route::post('/stock-adjustments/{id}/restore', [App\Http\Controllers\StockAdjustmentController::class, 'restore'])->name('stock-adjustments.restore');
    Route::delete('/stock-adjustments/{id}/force-delete', [App\Http\Controllers\StockAdjustmentController::class, 'forceDelete'])->name('stock-adjustments.force-delete');
    Route::resource('stock-adjustments', App\Http\Controllers\StockAdjustmentController::class)->only(['index', 'create', 'store', 'destroy']);
});

// Akses Absolut / Eksekutif (Hanya Superadmin: Laporan, Audit, Master Referensi, Manajemen User)
Route::middleware(['auth', 'verified', 'role:superadmin'])->group(function () {
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('/audit-logs', [App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::get('/references', [App\Http\Controllers\ReferenceController::class, 'index'])->name('references.index');

    // Location Types (dengan SoftDeletes)
    Route::post('/references/location-types', [App\Http\Controllers\ReferenceController::class, 'storeLocationType'])->name('references.location-types.store');
    Route::put('/references/location-types/{locationType}', [App\Http\Controllers\ReferenceController::class, 'updateLocationType'])->name('references.location-types.update');
    Route::delete('/references/location-types/{locationType}', [App\Http\Controllers\ReferenceController::class, 'destroyLocationType'])->name('references.location-types.destroy');
    Route::post('/references/location-types/{id}/restore', [App\Http\Controllers\ReferenceController::class, 'restoreLocationType'])->name('references.location-types.restore');
    Route::delete('/references/location-types/{id}/force-delete', [App\Http\Controllers\ReferenceController::class, 'forceDeleteLocationType'])->name('references.location-types.force-delete');
    Route::post('/references/location-types/bulk-destroy', [App\Http\Controllers\ReferenceController::class, 'bulkDestroyLocationType'])->name('references.location-types.bulk-destroy');
    Route::post('/references/location-types/bulk-restore', [App\Http\Controllers\ReferenceController::class, 'bulkRestoreLocationType'])->name('references.location-types.bulk-restore');
    Route::post('/references/location-types/bulk-force-delete', [App\Http\Controllers\ReferenceController::class, 'bulkForceDeleteLocationType'])->name('references.location-types.bulk-force-delete');

    // Supplier Types (dengan SoftDeletes)
    Route::post('/references/supplier-types', [App\Http\Controllers\ReferenceController::class, 'storeSupplierType'])->name('references.supplier-types.store');
    Route::put('/references/supplier-types/{supplierType}', [App\Http\Controllers\ReferenceController::class, 'updateSupplierType'])->name('references.supplier-types.update');
    Route::delete('/references/supplier-types/{supplierType}', [App\Http\Controllers\ReferenceController::class, 'destroySupplierType'])->name('references.supplier-types.destroy');
    Route::post('/references/supplier-types/{id}/restore', [App\Http\Controllers\ReferenceController::class, 'restoreSupplierType'])->name('references.supplier-types.restore');
    Route::delete('/references/supplier-types/{id}/force-delete', [App\Http\Controllers\ReferenceController::class, 'forceDeleteSupplierType'])->name('references.supplier-types.force-delete');
    Route::post('/references/supplier-types/bulk-destroy', [App\Http\Controllers\ReferenceController::class, 'bulkDestroySupplierType'])->name('references.supplier-types.bulk-destroy');
    Route::post('/references/supplier-types/bulk-restore', [App\Http\Controllers\ReferenceController::class, 'bulkRestoreSupplierType'])->name('references.supplier-types.bulk-restore');
    Route::post('/references/supplier-types/bulk-force-delete', [App\Http\Controllers\ReferenceController::class, 'bulkForceDeleteSupplierType'])->name('references.supplier-types.bulk-force-delete');

    // Medicine Categories (SoftDeletes — existing routes)
    Route::post('/references/medicine-categories', [App\Http\Controllers\ReferenceController::class, 'storeMedicineCategory'])->name('references.medicine-categories.store');
    Route::put('/references/medicine-categories/{medicineCategory}', [App\Http\Controllers\ReferenceController::class, 'updateMedicineCategory'])->name('references.medicine-categories.update');
    Route::delete('/references/medicine-categories/{medicineCategory}', [App\Http\Controllers\ReferenceController::class, 'destroyMedicineCategory'])->name('references.medicine-categories.destroy');
    Route::post('/references/medicine-categories/{id}/restore', [App\Http\Controllers\ReferenceController::class, 'restoreMedicineCategory'])->name('references.medicine-categories.restore');
    Route::delete('/references/medicine-categories/{id}/force-delete', [App\Http\Controllers\ReferenceController::class, 'forceDeleteMedicineCategory'])->name('references.medicine-categories.force-delete');
    Route::post('/references/medicine-categories/bulk-destroy', [App\Http\Controllers\ReferenceController::class, 'bulkDestroyMedicineCategory'])->name('references.medicine-categories.bulk-destroy');
    Route::post('/references/medicine-categories/bulk-restore', [App\Http\Controllers\ReferenceController::class, 'bulkRestoreMedicineCategory'])->name('references.medicine-categories.bulk-restore');
    Route::post('/references/medicine-categories/bulk-force-delete', [App\Http\Controllers\ReferenceController::class, 'bulkForceDeleteMedicineCategory'])->name('references.medicine-categories.bulk-force-delete');

    Route::resource('users', App\Http\Controllers\UserController::class);
});

require __DIR__.'/auth.php';