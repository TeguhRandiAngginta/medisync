<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // User yang melakukan aksi (bisa null jika sistem yang melakukan)
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Nama aksi: 'create', 'update', 'delete', 'login', dll
            $table->string('action'); 
            
            // Nama tabel/model yang diubah (misal: App\Models\Product)
            $table->string('model_type')->nullable(); 
            $table->unsignedBigInteger('model_id')->nullable();
            
            // Perubahan data (disimpan dalam format JSON)
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            
            // Informasi pelacakan
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};