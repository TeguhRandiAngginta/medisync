<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('medicines')->onDelete('cascade');
            $table->foreignId('purchase_detail_id')->nullable()->constrained('purchase_details')->onDelete('set null');
            $table->string('batch_number');
            $table->integer('stock_quantity');
            $table->date('expired_date');
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_batches');
    }
};