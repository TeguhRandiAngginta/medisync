<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Resep Masuk & Item
        if (Schema::hasTable('prescriptions') && !Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('prescription_items') && !Schema::hasColumn('prescription_items', 'deleted_at')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 2. Stock Opname / Penyesuaian Stok
        if (Schema::hasTable('stock_adjustments') && !Schema::hasColumn('stock_adjustments', 'deleted_at')) {
            Schema::table('stock_adjustments', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 3. Faktur Pembelian (Safety check)
        if (Schema::hasTable('purchases') && !Schema::hasColumn('purchases', 'deleted_at')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        if (Schema::hasTable('purchase_details') && !Schema::hasColumn('purchase_details', 'deleted_at')) {
            Schema::table('purchase_details', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // 4. Penjualan / Sales (Safety check)
        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'deleted_at')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        if (Schema::hasTable('sale_details') && !Schema::hasColumn('sale_details', 'deleted_at')) {
            Schema::table('sale_details', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('prescription_items') && Schema::hasColumn('prescription_items', 'deleted_at')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('prescriptions') && Schema::hasColumn('prescriptions', 'deleted_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('stock_adjustments') && Schema::hasColumn('stock_adjustments', 'deleted_at')) {
            Schema::table('stock_adjustments', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('purchase_details') && Schema::hasColumn('purchase_details', 'deleted_at')) {
            Schema::table('purchase_details', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('purchases') && Schema::hasColumn('purchases', 'deleted_at')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('sale_details') && Schema::hasColumn('sale_details', 'deleted_at')) {
            Schema::table('sale_details', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'deleted_at')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
