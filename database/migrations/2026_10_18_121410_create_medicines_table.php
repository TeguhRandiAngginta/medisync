<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke master data
            $table->foreignId('medicine_category_id')->constrained('medicine_categories')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('rack_id')->nullable()->constrained('racks')->nullOnDelete();

            // Identitas Obat
            $table->string('sku')->unique()->comment('Stock Keeping Unit / Kode Internal');
            $table->string('barcode')->nullable()->unique();
            $table->string('name');
            $table->string('generic_name')->nullable();
            
            // Spesifikasi Medis
            $table->string('dosage_form')->nullable()->comment('Bentuk sediaan: Tablet, Sirup, Salep');
            $table->string('dosage_strength')->nullable()->comment('Kekuatan dosis: 500mg, 10ml');
            $table->boolean('requires_prescription')->default(false)->comment('Apakah butuh resep dokter?');
            
            // Satuan & Parameter Stok
            $table->string('base_unit')->comment('Satuan dasar terkecil: Tablet, Kapsul, Botol');
            $table->integer('min_stock')->default(0)->comment('Batas bawah peringatan stok');
            $table->integer('max_stock')->nullable()->comment('Batas atas stok maksimal');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }   

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
