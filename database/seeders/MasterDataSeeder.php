<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Supplier;
use App\Models\Rack;
use App\Models\Product;
use App\Models\ProductUnit;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first();

        // 1. Kategori
        $catBebas = Category::firstOrCreate(['slug' => 'obat-bebas'], ['name' => 'Obat Bebas', 'description' => 'Obat tanpa resep dokter']);
        $catKeras = Category::firstOrCreate(['slug' => 'obat-keras'], ['name' => 'Obat Keras', 'description' => 'Harus dengan resep dokter']);
        $catAlkes = Category::firstOrCreate(['slug' => 'alkes'], ['name' => 'Alat Kesehatan', 'description' => 'Perlengkapan medis']);

        // 2. Satuan Dasar & Besar
        $unitTab = Unit::firstOrCreate(['symbol' => 'TAB'], ['name' => 'Tablet']);
        $unitStrip = Unit::firstOrCreate(['symbol' => 'STR'], ['name' => 'Strip']);
        $unitBox = Unit::firstOrCreate(['symbol' => 'BOX'], ['name' => 'Box']);
        $unitPcs = Unit::firstOrCreate(['symbol' => 'PCS'], ['name' => 'Pieces']);

        // 3. Rak Penyimpanan
        $rackDepan = Rack::firstOrCreate(['code' => 'RAK-A1', 'branch_id' => $branch->id], ['name' => 'Etalase Depan', 'description' => 'Area Kasir']);
        $rackGudang = Rack::firstOrCreate(['code' => 'GDG-01', 'branch_id' => $branch->id], ['name' => 'Gudang Belakang', 'description' => 'Stok Utama']);

        // 4. Supplier
        $supplier = Supplier::firstOrCreate(
            ['code' => 'SPL-001'],
            ['name' => 'PT. Bina San Prima', 'contact_person' => 'Budi', 'phone' => '081299998888']
        );


        $product1 = Product::firstOrCreate(
            ['sku' => '8991234567890'],
            [
                'category_id' => $catBebas->id,
                'base_unit_id' => $unitTab->id,
                'name' => 'Paracetamol 500mg',
                'type' => 'obat_bebas',
                'description' => 'Obat penurun panas dan pereda nyeri',
            ]
        );


        ProductUnit::firstOrCreate(
            ['product_id' => $product1->id, 'unit_id' => $unitTab->id],
            ['conversion_factor' => 1, 'purchase_price' => 200, 'selling_price' => 500, 'is_default_sales' => true]
        );

        ProductUnit::firstOrCreate(
            ['product_id' => $product1->id, 'unit_id' => $unitStrip->id],
            ['conversion_factor' => 10, 'purchase_price' => 1800, 'selling_price' => 4500]
        );

        ProductUnit::firstOrCreate(
            ['product_id' => $product1->id, 'unit_id' => $unitBox->id],
            ['conversion_factor' => 100, 'purchase_price' => 17000, 'selling_price' => 40000, 'is_default_purchase' => true]
        );
    }
}