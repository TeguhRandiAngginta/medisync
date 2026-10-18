<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            
            // Data krusial apotek
            $table->string('batch_number')->comment('Nomor lot/batch produksi pabrik');
            $table->date('expired_date')->comment('Tanggal kadaluarsa obat');
            
            $table->integer('quantity');
            $table->decimal('purchase_price', 15, 2)->comment('Harga beli per satuan terkecil (HPP)');
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_details');
    }
};
