<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    private const INDEX = 'cash_registers_one_open_shift_per_user';

    public function up(): void
    {
        // Satu user hanya boleh punya satu shift berstatus open (cegah klik ganda / request paralel).
        $duplicates = DB::table('cash_registers')
            ->where('status', 'open')
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('user_id');

        if ($duplicates->isNotEmpty()) {
            // Jangan memblokir deploy: data ganda harus dibereskan manual, index dibuat setelahnya.
            Log::warning('Index shift unik tidak dibuat: user berikut punya lebih dari satu shift open: ' . $duplicates->implode(', '));
            return;
        }

        DB::statement('CREATE UNIQUE INDEX ' . self::INDEX . " ON cash_registers (user_id) WHERE status = 'open'");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS ' . self::INDEX);
    }
};
