<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_number')->unique()->comment('Nomor Resep Digital');
            $table->string('patient_name')->comment('Nama Pasien di Resep Fisik');
            $table->string('doctor_name')->comment('Nama Dokter Penulis Resep');
            $table->date('prescription_date')->comment('Tanggal Penulisan Resep');
            $table->enum('status', ['DRAFT', 'DISPENSED'])->default('DRAFT')->comment('DRAFT = Belum dibayar di POS, DISPENSED = Sudah ditebus');
            $table->text('notes')->nullable()->comment('Catatan Tambahan Apoteker');
            $table->foreignId('user_id')->constrained('users')->comment('Apoteker yang mendata');
            $table->timestamps();
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->unsignedBigInteger('medicine_id'); 
            $table->integer('quantity');
            $table->string('signa')->comment('Aturan Pakai / Etiket, cth: 3x1 Sesudah Makan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
    }
};