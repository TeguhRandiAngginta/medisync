<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Supplier;
use App\Models\Rack;
use App\Models\ProductBatch;
use App\Models\SaleDetail;
use App\Models\PurchaseDetail;
use App\Models\StockAdjustment;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the medicines.
     * Supports optional ?trashed=true filter and provides trashed count.
     */
    public function index(Request $request)
    {
        $showTrashed = $request->boolean('trashed');

        $query = Medicine::with(['category', 'supplier', 'rack', 'batches'])
            ->when($showTrashed, fn($q) => $q->onlyTrashed())
            ->latest();

        $products = $query->get();
        $trashedCount = Medicine::onlyTrashed()->count();

        return Inertia::render('Products/Index', [
            'products'      => $products,
            'trashed'       => $showTrashed,
            'showTrashed'   => $showTrashed,
            'trashedCount'  => $trashedCount,
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Create', [
            'categories' => MedicineCategory::where('is_active', true)->get(),
            'suppliers'  => Supplier::where('is_active', true)->get(),
            'racks'      => Rack::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->filled('sku')) {
            $request->merge(['sku' => 'MED-' . date('Ym') . '-' . strtoupper(Str::random(4))]);
        }

        $validated = $request->validate([
            'sku' => 'required|string|unique:medicines,sku',
            'barcode' => 'nullable|string|unique:medicines,barcode',
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'medicine_category_id' => 'required|exists:medicine_categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'rack_id' => 'nullable|exists:racks,id',
            'dosage_form' => 'nullable|string|max:100',
            'dosage_strength' => 'nullable|string|max:100',
            'requires_prescription' => 'boolean',
            'base_unit' => 'required|string|max:50',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $medicine = Medicine::create($validated);

        AuditLog::record('inventaris', 'CREATE', "Menambahkan master obat baru: {$medicine->name}");

        return redirect()->route('products.index')->with('success', 'Data Obat berhasil ditambahkan ke master inventaris.');
    }

    /**
     * Soft delete (move to trash) a medicine.
     * Only allowed when there is no active batch stock.
     */
    public function destroy(Medicine $product)
    {
        $hasActiveBatch = ProductBatch::where('medicine_id', $product->id)
            ->where('stock_quantity', '>', 0)
            ->exists();

        // Allow moving to trash if stock is zero, even if there are historic batches.
        if ($hasActiveBatch) {
            return back()->withErrors([
                'message' => "Aksi Ditolak: Obat '{$product->name}' masih memiliki stok aktif dan tidak dapat dipindahkan ke Trash."
            ]);
        }

        DB::transaction(function () use ($product) {
            $name = $product->name;
            $product->delete(); // soft delete
            AuditLog::record('inventaris', 'DELETE', "Memindahkan obat '{$name}' ke Trash.");
        });

        return back()->with('success', "Obat {$product->name} berhasil dipindahkan ke Trash.");
    }

    /** Restore a soft‑deleted medicine */
    public function restore($id)
    {
        $product = Medicine::withTrashed()->findOrFail($id);

        DB::transaction(function () use ($product) {
            $name = $product->name;
            $product->restore();
            AuditLog::record('inventaris', 'RESTORE', "Mengembalikan obat '{$name}' dari Trash.");
        });

        return back()->with('success', "Obat {$product->name} berhasil dipulihkan.");
    }

    /** Bulk soft‑delete (move to trash) */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        $allowed = [];
        foreach ($ids as $id) {
            $product = Medicine::find($id);
            if (! $product) continue;
            $hasActiveBatch = ProductBatch::where('medicine_id', $id)
                ->where('stock_quantity', '>', 0)
                ->exists();
            if (! $hasActiveBatch) {
                $allowed[] = $product;
            }
        }

        DB::transaction(function () use ($allowed) {
            foreach ($allowed as $product) {
                $name = $product->name;
                $product->delete();
                AuditLog::record('inventaris', 'DELETE', "Memindahkan obat '{$name}' ke Trash (bulk).");
            }
        });

        return back()->with('success', count($allowed) . " obat berhasil dipindahkan ke Trash.");
    }

    /** Bulk restore from trash */
    public function bulkRestore(Request $request)
    {
        $ids = $request->input('ids', []);
        DB::transaction(function () use ($ids) {
            $products = Medicine::onlyTrashed()->whereIn('id', $ids)->get();
            foreach ($products as $product) {
                $name = $product->name;
                $product->restore();
                AuditLog::record('inventaris', 'RESTORE', "Mengembalikan obat '{$name}' dari Trash (bulk).");
            }
        });

        return back()->with('success', count($ids) . " obat berhasil dipulihkan.");
    }

    /** Permanently delete a medicine */
    public function forceDelete($id)
    {
        $product = Medicine::withTrashed()->findOrFail($id);

        $reasons = [];
        $salesCount = SaleDetail::withTrashed()->where('medicine_id', $id)->count();
        if ($salesCount > 0) {
            $reasons[] = "Riwayat Penjualan ({$salesCount} item pada sale_details)";
        }
        $purchaseCount = PurchaseDetail::withTrashed()->where('medicine_id', $id)->count();
        if ($purchaseCount > 0) {
            $reasons[] = "Faktur Pembelian ({$purchaseCount} item pada purchase_details)";
        }
        $adjustCount = StockAdjustment::withTrashed()->where('medicine_id', $id)->count();
        if ($adjustCount > 0) {
            $reasons[] = "Penyesuaian Stok ({$adjustCount} catatan pada stock_adjustments)";
        }

        if (!empty($reasons)) {
            $reasonList = implode(', ', $reasons);
            return back()->withErrors([
                'message' => "Aksi Ditolak: Obat '{$product->name}' tidak dapat dihapus secara permanen karena masih tercatat pada: {$reasonList} (termasuk riwayat di dalam Trash)."
            ]);
        }

        DB::transaction(function () use ($product) {
            $name = $product->name;
            $product->forceDelete();
            AuditLog::record('inventaris', 'FORCE_DELETE', "Menghapus permanen obat '{$name}'.");
        });

        return back()->with('success', "Obat {$product->name} telah dihapus secara permanen.");
    }

    /** Bulk permanently delete medicines */
    public function bulkForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = $validated['ids'];
        $products = Medicine::onlyTrashed()->whereIn('id', $ids)->get();

        $deletedCount = 0;
        $failedDetails = [];

        DB::transaction(function () use ($products, &$deletedCount, &$failedDetails) {
            foreach ($products as $product) {
                $reasons = [];
                $salesCount = SaleDetail::withTrashed()->where('medicine_id', $product->id)->count();
                if ($salesCount > 0) {
                    $reasons[] = "Penjualan ({$salesCount})";
                }
                $purchaseCount = PurchaseDetail::withTrashed()->where('medicine_id', $product->id)->count();
                if ($purchaseCount > 0) {
                    $reasons[] = "Pembelian ({$purchaseCount})";
                }
                $adjustCount = StockAdjustment::withTrashed()->where('medicine_id', $product->id)->count();
                if ($adjustCount > 0) {
                    $reasons[] = "Stock Opname ({$adjustCount})";
                }

                if (!empty($reasons)) {
                    $failedDetails[] = "{$product->name} [" . implode(', ', $reasons) . "]";
                    continue;
                }

                $name = $product->name;
                $product->forceDelete();
                AuditLog::record('inventaris', 'FORCE_DELETE', "Menghapus permanen obat '{$name}' (bulk).");
                $deletedCount++;
            }
        });

        if (count($failedDetails) > 0 && $deletedCount === 0) {
            return back()->withErrors([
                'message' => 'Seluruh obat terpilih tidak dapat dihapus permanen karena masih memiliki riwayat transaksi: ' . implode('; ', $failedDetails) . '.'
            ]);
        }

        $message = "{$deletedCount} obat berhasil dihapus secara permanen.";
        if (count($failedDetails) > 0) {
            $message .= ' Namun ' . count($failedDetails) . ' obat dilewati karena masih terikat riwayat transaksi: ' . implode('; ', $failedDetails) . '.';
        }

        return back()->with('success', $message);
    }

    public function edit(Medicine $product)
    {
        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => MedicineCategory::where('is_active', true)->get(),
            'suppliers' => Supplier::where('is_active', true)->get(),
            'racks' => Rack::where('is_active', true)->get(),
        ]);
    }

    public function update(Request $request, Medicine $product)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:medicines,sku,' . $product->id,
            'barcode' => 'nullable|string|unique:medicines,barcode,' . $product->id,
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'medicine_category_id' => 'required|exists:medicine_categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'rack_id' => 'nullable|exists:racks,id',
            'dosage_form' => 'nullable|string|max:100',
            'dosage_strength' => 'nullable|string|max:100',
            'requires_prescription' => 'boolean',
            'base_unit' => 'required|string|max:50',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);
        AuditLog::record('inventaris', 'UPDATE', "Memperbarui data master obat: {$product->name}");

        return redirect()->route('products.index')->with('success', 'Perubahan Master Obat berhasil disimpan.');
    }

    public function quickStore(Request $request)
    {
        if (! $request->filled('sku')) {
            $request->merge(['sku' => 'MED-' . date('Ym') . '-' . strtoupper(Str::random(4))]);
        }
        $request->merge(['sku' => strtoupper($request->sku)]);

        $validated = $request->validate([
            'sku' => 'required|string|unique:medicines,sku',
            'barcode' => 'nullable|string|unique:medicines,barcode',
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'medicine_category_id' => 'required|exists:medicine_categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'rack_id' => 'nullable|exists:racks,id',
            'dosage_form' => 'nullable|string|max:100',
            'dosage_strength' => 'nullable|string|max:100',
            'requires_prescription' => 'boolean',
            'base_unit' => 'required|string|max:50',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $medicine = Medicine::create($validated);

        AuditLog::record('inventaris', 'CREATE', "Menambahkan master obat baru (Quick Add via Faktur): {$medicine->name}");

        return response()->json([
            'message' => "Obat {$medicine->name} ({$medicine->sku}) berhasil ditambahkan ke Katalog Obat!",
            'medicine' => [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'sku' => $medicine->sku,
                'base_unit' => $medicine->base_unit,
            ],
        ]);
    }
}
