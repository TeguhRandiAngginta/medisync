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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_number')->unique(); // No. Rekam Medis
            $table->string('name');
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->string('phone', 50)->nullable();
            $table->text('address')->nullable();
            $table->text('allergies')->nullable(); // Sangat penting untuk apotek
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
