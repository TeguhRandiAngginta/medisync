<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Supplier;
use App\Models\Rack;
use App\Models\AuditLog;
use Illuminate\Http\Request;
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
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
        ]);

        $medicine = Medicine::create($validated);
        
        AuditLog::record('inventaris', 'CREATE', "Menambahkan master obat baru: {$medicine->name}");

        return redirect()->route('products.index')->with('success', 'Data Obat berhasil ditambahkan ke master inventaris.');
    }

    public function destroy(Medicine $product)
    {
        $name = $product->name;
        $product->delete(); 
        
        AuditLog::record('inventaris', 'DELETE', "Menghapus data obat: {$name}");
        return back()->with('success', "Obat {$name} berhasil dihapus dari sistem.");
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
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
        ]);

        $product->update($validated);
        
        AuditLog::record('inventaris', 'UPDATE', "Memperbarui data master obat: {$product->name}");

        return redirect()->route('products.index')->with('success', 'Perubahan Master Obat berhasil disimpan.');
    }
}