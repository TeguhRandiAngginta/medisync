<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LocationType;
use App\Models\SupplierType;
use App\Models\MedicineCategory;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tipe Lokasi Penyimpanan (Untuk Rak / Etalase)
        LocationType::firstOrCreate(['prefix_code' => 'ET'], [
            'name' => 'Etalase Depan', 
            'intended_for' => 'Kasir / Etalase Penjualan', 
            'description' => 'Area pajangan obat bagian depan'
        ]);
        LocationType::firstOrCreate(['prefix_code' => 'GD'], [
            'name' => 'Gudang Utama', 
            'intended_for' => 'Penyimpanan Stok Besar', 
            'description' => 'Area penyimpanan stok gudang belakang'
        ]);

        // 2. Tipe Pemasok / Supplier
        SupplierType::firstOrCreate(['prefix_code' => 'PBF'], [
            'name' => 'PBF Utama', 
            'description' => 'Pedagang Besar Farmasi Skala Nasional'
        ]);
        SupplierType::firstOrCreate(['prefix_code' => 'LOK'], [
            'name' => 'Distributor Lokal', 
            'description' => 'Distributor atau agen wilayah lokal'
        ]);

        // 3. Golongan / Kategori Obat Standar BPOM
        MedicineCategory::firstOrCreate(['name' => 'Obat Bebas'], [
            'description' => 'Dapat dibeli bebas tanpa resep (Lingkaran Hijau)', 
            'is_active' => true
        ]);
        MedicineCategory::firstOrCreate(['name' => 'Obat Bebas Terbatas'], [
            'description' => 'Bebas terbatas dengan tanda peringatan (Lingkaran Biru)', 
            'is_active' => true
        ]);
        MedicineCategory::firstOrCreate(['name' => 'Obat Keras'], [
            'description' => 'Hanya dengan resep dokter (Lingkaran Merah dengan huruf K)', 
            'is_active' => true
        ]);
        MedicineCategory::firstOrCreate(['name' => 'Obat Paten / Bermerek'], [
            'description' => 'Obat dengan hak paten produsen farmasi', 
            'is_active' => true
        ]);
    }
}