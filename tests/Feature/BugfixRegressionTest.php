<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Regresi untuk bug hasil screening (lihat CHANGELOG.md).
 */
class BugfixRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'Superadmin']);
        $branch = Branch::create(['code' => 'CBG-01', 'name' => 'Cabang', 'address' => 'Jl. A', 'phone' => '0812']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);

        $category = MedicineCategory::create(['name' => 'Obat Bebas', 'is_active' => true]);
        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'name' => 'Paracetamol 500mg',
            'sku' => 'MED-PCT-500',
            'base_unit' => 'Tablet',
            'selling_price' => 10000,
            'min_stock' => 5,
            'is_active' => true,
        ]);
    }

    private function batch(string $number, int $stock, string $expired): ProductBatch
    {
        return ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => $number,
            'stock_quantity' => $stock,
            'expired_date' => $expired,
            'purchase_price' => 5000,
        ]);
    }

    public function test_fefo_skips_expired_batches(): void
    {
        $expired = $this->batch('EXP', 5, now()->subDay()->toDateString());
        $valid = $this->batch('OK', 5, now()->addMonths(6)->toDateString());

        $result = InventoryService::deductStockFEFO($this->medicine->id, 3);

        $this->assertSame('OK', $result['batch_number']);
        $this->assertEquals(5, $expired->fresh()->stock_quantity);
        $this->assertEquals(2, $valid->fresh()->stock_quantity);

        // Sisa valid hanya 2: batch kedaluwarsa tidak boleh menutup kekurangan.
        $this->expectExceptionMessage('tidak mencukupi');
        InventoryService::deductStockFEFO($this->medicine->id, 3);
    }

    public function test_delete_restore_delete_does_not_inflate_stock(): void
    {
        $batch = $this->batch('B1', 10, now()->addYear()->toDateString());
        $this->medicine->update(['stock' => 10]);

        $sale = Sale::create([
            'invoice_number' => 'INV-X', 'user_id' => $this->user->id, 'total_amount' => 40000,
            'subtotal_amount' => 40000, 'paid_amount' => 40000, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        $deduction = InventoryService::deductStockFEFO($this->medicine->id, 4);
        $detail = SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $this->medicine->id, 'batch_number' => 'B1',
            'quantity' => 4, 'selling_price' => 10000, 'subtotal' => 40000, 'purchase_price' => 5000,
        ]);
        InventoryService::recordSaleDetailBatches($detail->id, $deduction['batches']);
        $this->assertEquals(6, $batch->fresh()->stock_quantity);

        $sale->delete();
        $this->assertEquals(10, $batch->fresh()->stock_quantity);

        $sale->restore();
        $this->assertEquals(6, $batch->fresh()->stock_quantity);

        $sale->delete();
        $this->assertEquals(10, $batch->fresh()->stock_quantity, 'Stok tidak boleh membengkak setelah hapus-pulihkan-hapus.');
        $this->assertSame(1, DB::table('sale_detail_batches')->where('sale_detail_id', $detail->id)->count());
    }

    public function test_restore_with_insufficient_stock_returns_error_not_500(): void
    {
        $batch = $this->batch('B1', 4, now()->addYear()->toDateString());
        $sale = Sale::create([
            'invoice_number' => 'INV-Y', 'user_id' => $this->user->id, 'total_amount' => 40000,
            'subtotal_amount' => 40000, 'paid_amount' => 40000, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $this->medicine->id, 'batch_number' => 'B1',
            'quantity' => 4, 'selling_price' => 10000, 'subtotal' => 40000, 'purchase_price' => 5000,
        ]);
        $sale->delete();                       // stok batch jadi 8
        $batch->update(['stock_quantity' => 0]); // stok habis terjual di tempat lain

        $response = $this->actingAs($this->user)->post(route('sales.restore', $sale->id));

        $response->assertSessionHasErrors(['message']);
        $this->assertSoftDeleted('sales', ['id' => $sale->id]);

        $response = $this->actingAs($this->user)->post(route('sales.bulk-restore'), ['ids' => [$sale->id]]);
        $response->assertSessionHasErrors(['message']);
    }

    private function openShift(): void
    {
        CashRegister::create([
            'user_id' => $this->user->id, 'branch_id' => $this->user->branch_id,
            'opening_amount' => 0, 'opened_at' => now(), 'status' => 'open',
        ]);
    }

    public function test_pos_uses_server_price_and_computes_change(): void
    {
        $this->openShift();
        $this->batch('B1', 10, now()->addYear()->toDateString());

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => 2, 'price' => 1]], // harga palsu dari klien
            'paid_amount' => 30000,
            'change_amount' => 999999,                                               // kembalian palsu
            'payment_method' => 'Cash',
        ])->assertSessionHasNoErrors();

        $sale = Sale::firstOrFail();
        $this->assertEquals(20000, $sale->total_amount);
        $this->assertEquals(10000, $sale->change_amount);
        $this->assertEquals(10000, $sale->details()->first()->selling_price);
    }

    public function test_pos_rejects_underpayment_and_unknown_medicine(): void
    {
        $this->openShift();
        $batch = $this->batch('B1', 10, now()->addYear()->toDateString());

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => 2, 'price' => 10000]],
            'paid_amount' => 5000, 'payment_method' => 'Cash',
        ])->assertSessionHasErrors(['message']);

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => 99999, 'quantity' => 1, 'price' => 1]],
            'paid_amount' => 5000, 'payment_method' => 'Cash',
        ])->assertSessionHasErrors(['message']);

        $this->assertSame(0, Sale::count());
        $this->assertEquals(10, $batch->fresh()->stock_quantity);
    }
}
