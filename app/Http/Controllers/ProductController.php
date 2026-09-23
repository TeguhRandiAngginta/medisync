<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        // Mengambil produk beserta Kategori, Satuan Dasar, dan Daftar Harga Konversi
        $products = Product::with(['category', 'baseUnit', 'productUnits.unit'])->latest()->get();

        return Inertia::render('Products/Index', [
            'products' => $products
        ]);
    }
}