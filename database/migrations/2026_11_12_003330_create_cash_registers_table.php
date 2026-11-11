<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->decimal('opening_amount', 15, 2)->default(0); 
            $table->decimal('closing_amount', 15, 2)->nullable(); 
            $table->decimal('system_cash_amount', 15, 2)->default(0); 
            $table->decimal('system_qris_amount', 15, 2)->default(0); 
            $table->decimal('system_transfer_amount', 15, 2)->default(0); 
            $table->text('notes')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('cash_register_id')->nullable()->after('user_id')->constrained('cash_registers')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['cash_register_id']);
            $table->dropColumn('cash_register_id');
        });
        Schema::dropIfExists('cash_registers');
    }
};