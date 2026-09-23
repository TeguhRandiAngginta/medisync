<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ProductUnit;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'baseUnit', 'productUnits.unit'])->latest()->get();

        return Inertia::render('Products/Index', [
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|unique:products,sku',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'base_unit_id' => 'required|exists:units,id',
            'type' => 'required|in:obat_bebas,obat_keras,resep,alkes,suplemen,skincare',
            'description' => 'nullable|string',

            'product_units' => 'required|array|min:1',
            'product_units.*.unit_id' => 'required|exists:units,id',
            'product_units.*.conversion_factor' => 'required|integer|min:1',
            'product_units.*.purchase_price' => 'required|numeric|min:0',
            'product_units.*.selling_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            
            // Simpan produk utama
            $product = Product::create([
                'sku' => $validated['sku'],
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'base_unit_id' => $validated['base_unit_id'],
                'type' => $validated['type'],
                'description' => $validated['description'] ?? '',
            ]);

            foreach ($validated['product_units'] as $unitData) {
                ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_id' => $unitData['unit_id'],
                    'conversion_factor' => $unitData['conversion_factor'],
                    'purchase_price' => $unitData['purchase_price'],
                    'selling_price' => $unitData['selling_price'],
                    'is_default_purchase' => $unitData['is_default_purchase'] ?? false,
                    'is_default_sales' => $unitData['is_default_sales'] ?? false,
                ]);
            }
        });
        return redirect()->route('products.index');
    }

    public function create()
    {
        $categories = \App\Models\Category::where('is_active', true)->get();
        $units = \App\Models\Unit::where('is_active', true)->get();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'units' => $units
        ]);
    }
}