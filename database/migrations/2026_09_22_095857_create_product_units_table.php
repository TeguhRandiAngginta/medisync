<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            
            // conversion_factor = rasio ke satuan terkecil (base_unit). 
            // Misal: Base = Tablet (1). Strip isi 10 (10). Box isi 100 (100).
            $table->integer('conversion_factor')->default(1);
            
            // Harga khusus untuk satuan ini
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            
            // Penanda satuan default saat PO (beli) dan POS (jual)
            $table->boolean('is_default_purchase')->default(false);
            $table->boolean('is_default_sales')->default(false);
            
            $table->timestamps();
            
            // Mencegah duplikasi satuan pada satu produk yang sama
            $table->unique(['product_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_units');
    }
};