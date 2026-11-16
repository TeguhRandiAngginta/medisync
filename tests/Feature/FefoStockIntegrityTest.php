<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\SaleDetailBatch;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FefoStockIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => 'Superadmin',
            'slug' => 'superadmin',
            'description' => 'Superadmin',
        ]);

        $branch = Branch::create([
            'code' => 'CBG-01',
            'name' => 'Cabang Utama',
            'address' => 'Jl. Merdeka No. 1',
            'phone' => '08123456789',
        ]);

        $this->user = User::factory()->create([
            'role_id' => $role->id,
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $supplier = Supplier::create([
            'code' => 'PBF-01',
            'name' => 'PBF Kimia Farma',
            'phone' => '0812345678',
            'address' => 'Jl. Farmasi',
        ]);

        $category = \App\Models\MedicineCategory::create([
            'name' => 'Obat Bebas',
            'is_active' => true,
        ]);

        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'name' => 'Paracetamol 500mg',
            'generic_name' => 'Paracetamol',
            'sku' => 'MED-PCT-500',
            'base_unit' => 'Tablet',
            'selling_price' => 10000,
            'min_stock' => 5,
            'max_stock' => 100,
            'is_active' => true,
            'supplier_id' => $supplier->id,
        ]);
    }

    public function test_sale_fillable_includes_cash_register_id(): void
    {
        $sale = new Sale();
        $this->assertContains('cash_register_id', $sale->getFillable());
    }

    public function test_deduct_stock_fefo_returns_accurate_batches_and_hpp(): void
    {
        $batch1 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-001',
            'stock_quantity' => 10,
            'expired_date' => now()->addMonths(3)->toDateString(),
            'purchase_price' => 5000,
        ]);

        $batch2 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-002',
            'stock_quantity' => 20,
            'expired_date' => now()->addMonths(6)->toDateString(),
            'purchase_price' => 6000,
        ]);

        $this->medicine->update(['stock' => 30]);

        // Deduct 15 items: should consume 10 from BATCH-001 and 5 from BATCH-002
        $result = InventoryService::deductStockFEFO($this->medicine->id, 15);

        $this->assertIsArray($result);
        $this->assertEquals('BATCH-001', $result['batch_number']);
        $this->assertCount(2, $result['batches']);
        
        // HPP = (10*5000 + 5*6000) / 15 = (50000 + 30000) / 15 = 80000 / 15 = 5333.333...
        $this->assertEqualsWithDelta(5333.33, $result['unit_hpp'], 0.01);

        $batch1->refresh();
        $batch2->refresh();
        $this->assertEquals(0, $batch1->stock_quantity);
        $this->assertEquals(15, $batch2->stock_quantity);

        $this->medicine->refresh();
        $this->assertEquals(15, $this->medicine->stock);
    }

    public function test_restore_stock_fefo_prioritizes_origin_batch(): void
    {
        $batch1 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-ORIGIN',
            'stock_quantity' => 0,
            'expired_date' => now()->addMonths(3)->toDateString(),
            'purchase_price' => 5000,
        ]);

        $batch2 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-OTHER',
            'stock_quantity' => 10,
            'expired_date' => now()->addMonths(12)->toDateString(),
            'purchase_price' => 7000,
        ]);

        // Restore using batch_number BATCH-ORIGIN
        InventoryService::restoreStockFEFO($this->medicine->id, 5, 'BATCH-ORIGIN');

        $batch1->refresh();
        $batch2->refresh();

        $this->assertEquals(5, $batch1->stock_quantity);
        $this->assertEquals(10, $batch2->stock_quantity);
    }

    public function test_purchase_destroy_rejected_when_batch_stock_has_been_sold(): void
    {
        $supplier = Supplier::first();
        $purchase = Purchase::create([
            'internal_receipt_number' => 'REC-001',
            'invoice_number' => 'INV-PBF-001',
            'supplier_id' => $supplier->id,
            'user_id' => $this->user->id,
            'purchase_date' => now()->toDateString(),
            'total_amount' => 50000,
            'status' => 'completed',
        ]);

        $detail = PurchaseDetail::create([
            'purchase_id' => $purchase->id,
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-SOLD',
            'expired_date' => now()->addYear()->toDateString(),
            'quantity' => 10,
            'purchase_price' => 5000,
            'subtotal' => 50000,
        ]);

        $batch = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'purchase_detail_id' => $detail->id,
            'batch_number' => 'BATCH-SOLD',
            'stock_quantity' => 7, // 3 have been sold (stock_quantity < quantity)
            'expired_date' => now()->addYear()->toDateString(),
            'purchase_price' => 5000,
        ]);

        $response = $this->actingAs($this->user)->delete(route('purchases.destroy', $purchase));

        $response->assertSessionHasErrors(['message']);
        $this->assertDatabaseHas('purchases', ['id' => $purchase->id, 'deleted_at' => null]);
    }

    public function test_purchase_bulk_destroy_rejected_when_any_batch_is_sold(): void
    {
        $supplier = Supplier::first();
        $purchase = Purchase::create([
            'internal_receipt_number' => 'REC-002',
            'invoice_number' => 'INV-PBF-002',
            'supplier_id' => $supplier->id,
            'user_id' => $this->user->id,
            'purchase_date' => now()->toDateString(),
            'total_amount' => 50000,
            'status' => 'completed',
        ]);

        $detail = PurchaseDetail::create([
            'purchase_id' => $purchase->id,
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-BULK-SOLD',
            'expired_date' => now()->addYear()->toDateString(),
            'quantity' => 10,
            'purchase_price' => 5000,
            'subtotal' => 50000,
        ]);

        ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'purchase_detail_id' => $detail->id,
            'batch_number' => 'BATCH-BULK-SOLD',
            'stock_quantity' => 5, // sold partially
            'expired_date' => now()->addYear()->toDateString(),
            'purchase_price' => 5000,
        ]);

        $response = $this->actingAs($this->user)->post(route('purchases.bulk-destroy'), [
            'ids' => [$purchase->id],
        ]);

        $response->assertSessionHasErrors(['message']);
        $this->assertDatabaseHas('purchases', ['id' => $purchase->id, 'deleted_at' => null]);
    }

    public function test_bulk_restore_triggers_restored_event_and_deducts_stock(): void
    {
        $batch = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-RESTORE-TEST',
            'stock_quantity' => 10,
            'expired_date' => now()->addYear()->toDateString(),
            'purchase_price' => 5000,
        ]);
        $this->medicine->update(['stock' => 10]);

        $sale = Sale::create([
            'invoice_number' => 'INV-TEST-001',
            'user_id' => $this->user->id,
            'total_amount' => 20000,
            'subtotal_amount' => 20000,
            'paid_amount' => 20000,
            'change_amount' => 0,
            'payment_method' => 'cash',
            'sale_date' => now(),
        ]);

        $detail = SaleDetail::create([
            'sale_id' => $sale->id,
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-RESTORE-TEST',
            'quantity' => 4,
            'selling_price' => 10000,
            'subtotal' => 40000,
            'purchase_price' => 5000,
        ]);

        // Soft-deleting sale will restore 4 items to the batch
        $sale->delete();
        $batch->refresh();
        $this->assertEquals(14, $batch->stock_quantity);

        // Bulk restoring sale must trigger restored event and deduct 4 items back
        $response = $this->actingAs($this->user)->post(route('sales.bulk-restore'), [
            'ids' => [$sale->id],
        ]);

        $response->assertSessionHasNoErrors();
        $batch->refresh();
        $this->assertEquals(10, $batch->stock_quantity);
    }

    public function test_pos_store_records_accurate_batch_and_cash_register(): void
    {
        $shift = \App\Models\CashRegister::create([
            'user_id' => $this->user->id,
            'branch_id' => $this->user->branch_id,
            'opening_amount' => 100000,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $batch1 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-DEPLETED',
            'stock_quantity' => 2, // only 2 left
            'expired_date' => now()->addMonths(2)->toDateString(),
            'purchase_price' => 4000,
        ]);

        $batch2 = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-NEXT',
            'stock_quantity' => 10,
            'expired_date' => now()->addMonths(5)->toDateString(),
            'purchase_price' => 5000,
        ]);

        $this->medicine->update(['stock' => 12]);

        // Buy 2 items, completely depleting BATCH-DEPLETED
        $cart = [
            [
                'id' => $this->medicine->id,
                'medicine_id' => $this->medicine->id,
                'name' => $this->medicine->name,
                'price' => 10000,
                'quantity' => 2,
            ]
        ];

        $response = $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => $cart,
            'paid_amount' => 20000,
            'change_amount' => 0,
            'payment_method' => 'cash',
        ]);

        $response->assertSessionHasNoErrors();

        $savedSale = Sale::latest()->first();
        $this->assertNotNull($savedSale);
        $this->assertEquals($shift->id, $savedSale->cash_register_id);

        $savedDetail = $savedSale->details()->first();
        $this->assertNotNull($savedDetail);
        // It must record the deducted batch (BATCH-DEPLETED), NOT the remaining next batch (BATCH-NEXT)
        $this->assertEquals('BATCH-DEPLETED', $savedDetail->batch_number);

        // Check that sale_detail_batches recorded the allocation
        $detailBatch = \Illuminate\Support\Facades\DB::table('sale_detail_batches')
            ->where('sale_detail_id', $savedDetail->id)
            ->first();
        $this->assertNotNull($detailBatch);
        $this->assertEquals($batch1->id, $detailBatch->product_batch_id);
        $this->assertEquals(2, $detailBatch->quantity);
    }
}
