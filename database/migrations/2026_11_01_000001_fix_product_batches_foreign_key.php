<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_batches', function (Blueprint $table) {
            if (Schema::hasColumn('product_batches', 'product_id') && !Schema::hasColumn('product_batches', 'medicine_id')) {
                $table->renameColumn('product_id', 'medicine_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_batches', function (Blueprint $table) {
            if (Schema::hasColumn('product_batches', 'medicine_id')) {
                $table->renameColumn('medicine_id', 'product_id');
            }
        });
    }
};