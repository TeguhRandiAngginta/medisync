<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            // base_unit_id adalah satuan terkecil (contoh: Tablet, Pcs, Kapsul)
            $table->foreignId('base_unit_id')->constrained('units')->restrictOnDelete(); 
            
            $table->string('sku')->unique()->comment('Barcode atau Kode Internal');
            $table->string('name');
            $table->enum('type', ['obat_bebas', 'obat_keras', 'resep', 'alkes', 'suplemen', 'skincare'])->default('obat_bebas');
            $table->text('description')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes(); // Hapus aman tanpa merusak riwayat transaksi
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};