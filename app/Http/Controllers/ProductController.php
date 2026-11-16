<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Supplier;
use App\Models\Rack;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Medicine::with(['category', 'supplier', 'rack'])->latest()->get();

        return Inertia::render('Products/Index', [
            'products' => $products
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Create', [
            'categories' => MedicineCategory::where('is_active', true)->get(),
            'suppliers' => Supplier::where('is_active', true)->get(),
            'racks' => Rack::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->filled('sku')) {
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

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $medicine = Medicine::create($validated);
        
        AuditLog::record('inventaris', 'CREATE', "Menambahkan master obat baru: {$medicine->name}");

        return redirect()->route('products.index')->with('success', 'Data Obat berhasil ditambahkan ke master inventaris.');
    }

    public function destroy(Medicine $product)
    {
        $hasActiveBatches = \App\Models\ProductBatch::where('medicine_id', $product->id)
            ->where('stock_quantity', '>', 0)
            ->exists();
        $hasSalesHistory = \App\Models\SaleDetail::where('medicine_id', $product->id)->exists();
        $hasPurchaseHistory = \App\Models\PurchaseDetail::where('medicine_id', $product->id)->exists();
        $hasBatchHistory = \App\Models\ProductBatch::withTrashed()->where('medicine_id', $product->id)->exists();

        if ($hasActiveBatches || $hasSalesHistory || $hasPurchaseHistory || $hasBatchHistory) {
            return back()->withErrors([
                'message' => "Aksi Ditolak: Obat '{$product->name}' tidak dapat dihapus karena sudah memiliki riwayat transaksi/batch aktif. (Solusi: Nonaktifkan status aktif obat jika sudah tidak digunakan)."
            ]);
        }

        try {
            DB::transaction(function () use ($product) {
                $name = $product->name;
                $product->delete();

                if (class_exists(AuditLog::class)) {
                    AuditLog::record('inventaris', 'DELETE', "Menghapus data obat: {$name}");
                }
            });

            return back()->with('success', "Obat {$product->name} berhasil dihapus dari sistem.");
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal menghapus obat: ' . $e->getMessage()]);
        }
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
        if (!$request->filled('sku')) {
            $request->merge(['sku' => 'MED-' . date('Ym') . '-' . strtoupper(Str::random(4))]);
        }

        $validated = $request->validate([
            'sku'                   => 'required|string|unique:medicines,sku',
            'barcode'               => 'nullable|string|unique:medicines,barcode',
            'name'                  => 'required|string|max:255',
            'generic_name'          => 'nullable|string|max:255',
            'medicine_category_id'  => 'required|exists:medicine_categories,id',
            'supplier_id'           => 'nullable|exists:suppliers,id',
            'rack_id'               => 'nullable|exists:racks,id',
            'dosage_form'           => 'nullable|string|max:100',
            'dosage_strength'       => 'nullable|string|max:100',
            'requires_prescription' => 'boolean',
            'base_unit'             => 'required|string|max:50',
            'selling_price'         => 'required|numeric|min:0',
            'min_stock'             => 'required|integer|min:0',
            'max_stock'             => 'nullable|integer|min:0',
            'is_active'             => 'boolean',
        ]);

        $validated['sku'] = strtoupper($validated['sku']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $medicine = Medicine::create($validated);

        AuditLog::record('inventaris', 'CREATE', "Menambahkan master obat baru (Quick Add via Faktur): {$medicine->name}");

        return response()->json([
            'message'  => "Obat {$medicine->name} ({$medicine->sku}) berhasil ditambahkan ke Katalog Obat!",
            'medicine' => [
                'id'        => $medicine->id,
                'name'      => $medicine->name,
                'sku'       => $medicine->sku,
                'base_unit' => $medicine->base_unit,
            ]
        ]);
    }
}