<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            // Uang tunai yang seharusnya ada di laci = modal awal + tunai bersih penjualan shift.
            $table->decimal('expected_cash_amount', 15, 2)->nullable()->after('system_transfer_amount');
            // Selisih = uang fisik - seharusnya. Negatif = kurang, positif = lebih. NULL = shift lama/belum ditutup.
            $table->decimal('cash_difference', 15, 2)->nullable()->after('expected_cash_amount');
        });
    }

    public function down(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn(['expected_cash_amount', 'cash_difference']);
        });
    }
};
