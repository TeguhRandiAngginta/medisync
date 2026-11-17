<?php

namespace Tests\Feature;

use App\Http\Controllers\ReportController;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\StockAdjustment;
use App\Models\Supplier;
use App\Models\SupplierType;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Kartu stok harus selalu cocok dengan stok obat (medicines.stock).
 */
class StockLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
        $category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $type = SupplierType::create(['name' => 'PBF', 'prefix_code' => 'PBF']);
        $this->supplier = Supplier::create(['supplier_type_id' => $type->id, 'code' => 'S1', 'name' => 'PBF Sehat', 'is_active' => true]);
        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id, 'name' => 'Paracetamol', 'sku' => 'PCT', 'base_unit' => 'Tablet',
            'selling_price' => 10000, 'min_stock' => 1, 'is_active' => true,
        ]);
        CashRegister::create([
            'user_id' => $this->user->id, 'branch_id' => $branch->id, 'opening_amount' => 0, 'opened_at' => now(), 'status' => 'open',
        ]);
        $this->actingAs($this->user);
    }

    private function buy(int $qty, string $date): void
    {
        $this->post(route('purchases.store'), [
            'internal_receipt_number' => 'BPB-' . uniqid(), 'invoice_number' => 'INV-' . uniqid(),
            'supplier_id' => $this->supplier->id, 'purchase_date' => $date,
            'items' => [[
                'medicine_id' => $this->medicine->id, 'batch_number' => 'B' . uniqid(),
                'expired_date' => now()->addYear()->toDateString(), 'quantity' => $qty, 'uom' => 'Tablet', 'purchase_price' => 5000,
            ]],
        ])->assertSessionHasNoErrors();
    }

    private function sell(int $qty): Sale
    {
        $this->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => $qty]],
            'paid_amount' => 1000000, 'payment_method' => 'Cash',
        ])->assertSessionHasNoErrors();

        return Sale::latest('id')->firstOrFail();
    }

    private function adjustTo(int $actual, string $type): StockAdjustment
    {
        InventoryService::adjustBatchStock(ProductBatch::firstOrFail()->id, $actual, $type, 'test');
        return StockAdjustment::latest('id')->firstOrFail();
    }

    private function ledger(string $start, string $end): array
    {
        $m = new ReflectionMethod(ReportController::class, 'generateStockLedger');
        $m->setAccessible(true);

        return $m->invoke(new ReportController(), $this->medicine->id, $start, $end);
    }

    private function wide(): array
    {
        return [now()->subDays(30)->toDateString(), now()->toDateString()];
    }

    public function test_ledger_includes_purchases_sales_and_opname_with_running_balance(): void
    {
        $this->buy(20, now()->subDays(10)->toDateString());
        $this->sell(4);                                    // 16
        $this->adjustTo(19, 'CORRECTION');                 // +3 => 19
        $this->adjustTo(17, 'DAMAGE');                     // -2 => 17

        $rows = array_reverse($this->ledger(...$this->wide())); // urut lama -> baru

        $this->assertCount(4, $rows);
        $this->assertSame([20, 16, 19, 17], array_column($rows, 'balance'));
        $this->assertSame(['IN', 'OUT', 'IN', 'OUT'], array_column($rows, 'type'));
        $this->assertStringStartsWith('OPN-', $rows[2]['reference']);

        $this->assertEquals($this->medicine->fresh()->stock, $rows[3]['balance'], 'Saldo akhir kartu stok harus sama dengan stok obat.');
    }

    public function test_cancelled_sale_and_opname_are_excluded_and_ledger_still_matches_stock(): void
    {
        $this->buy(20, now()->subDays(10)->toDateString());
        $sale = $this->sell(4);
        $plus = $this->adjustTo(19, 'CORRECTION');
        $minus = $this->adjustTo(17, 'DAMAGE');

        $sale->delete();                                                                  // stok +4 => 21
        $this->delete(route('stock-adjustments.destroy', $plus->id))->assertSessionHasNoErrors();   // 18
        $this->delete(route('stock-adjustments.destroy', $minus->id))->assertSessionHasNoErrors();  // 20

        $rows = $this->ledger(...$this->wide());

        $this->assertCount(1, $rows);
        $this->assertSame(20, $rows[0]['balance']);
        $this->assertEquals($this->medicine->fresh()->stock, $rows[0]['balance']);
    }

    public function test_opening_balance_comes_from_movements_before_period(): void
    {
        $this->buy(20, now()->subDays(10)->toDateString());
        $this->sell(4);

        $rows = $this->ledger(now()->toDateString(), now()->toDateString());

        $this->assertCount(1, $rows);
        $this->assertSame('OUT', $rows[0]['type']);
        $this->assertSame(20, $rows[0]['balance_before']);
        $this->assertSame(16, $rows[0]['balance']);
    }

    public function test_mutations_export_renders_rows_and_balance(): void
    {
        $this->buy(20, now()->subDays(1)->toDateString());
        $this->adjustTo(18, 'LOST');

        $html = $this->get(route('reports.export', [
            'type' => 'mutations', 'format' => 'pdf',
            'start_date' => now()->subDays(30)->toDateString(), 'end_date' => now()->toDateString(),
        ]))->assertOk()->getContent();

        $this->assertStringContainsString('OPN-', $html);
        $this->assertStringContainsString('Paracetamol', $html);
        $this->assertStringContainsString('Saldo', $html);
    }
}
