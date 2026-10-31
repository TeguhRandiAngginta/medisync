<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('medicines')) {
            Schema::create('medicines', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('current_stock')->default(0);
                $table->integer('minimum_stock')->default(10);
                $table->boolean('is_active')->default(true);
                $table->softDeletes();
                $table->timestamps();
            });
        } else {
            Schema::table('medicines', function (Blueprint $table) {
                if (!Schema::hasColumn('medicines', 'current_stock')) {
                    $table->integer('current_stock')->default(0)->after('name');
                }
                if (!Schema::hasColumn('medicines', 'minimum_stock')) {
                    $table->integer('minimum_stock')->default(10)->after('current_stock');
                }
            });
        }

        if (!Schema::hasTable('sale_items')) {
            Schema::create('sale_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
                $table->foreignId('medicine_id')->constrained('medicines')->onDelete('restrict');
                $table->integer('quantity');
                $table->decimal('unit_price', 15, 2);
                $table->decimal('subtotal', 15, 2);
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('sale_items');
        // Kita tidak drop medicines karena mungkin dipakai tabel lain
    }
};