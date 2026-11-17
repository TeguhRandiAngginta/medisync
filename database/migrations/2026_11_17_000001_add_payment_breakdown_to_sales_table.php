<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rincian pembayaran terstruktur untuk rekonsiliasi shift.
        // NULL = transaksi lama (hanya punya string payment_method).
        Schema::table('sales', function (Blueprint $table) {
            // Tunai bersih: uang tunai diterima dikurangi kembalian (yang benar-benar tersisa di laci).
            $table->decimal('cash_amount', 15, 2)->nullable()->after('payment_method');
            $table->decimal('qris_amount', 15, 2)->nullable()->after('cash_amount');
            $table->decimal('transfer_amount', 15, 2)->nullable()->after('qris_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['cash_amount', 'qris_amount', 'transfer_amount']);
        });
    }
};
