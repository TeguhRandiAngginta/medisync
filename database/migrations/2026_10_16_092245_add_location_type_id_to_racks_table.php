<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('racks', function (Blueprint $table) {
            $table->foreignId('location_type_id')->nullable()->after('id')->constrained('location_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('racks', function (Blueprint $table) {
            $table->dropForeign(['location_type_id']);
            $table->dropColumn('location_type_id');
        });
    }
};
