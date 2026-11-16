<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\StockAdjustment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseFourCompletenessTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;
    protected ProductBatch $batch;

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

        $category = MedicineCategory::create([
            'name' => 'Obat Bebas',
            'is_active' => true,
        ]);

        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'name' => 'Amoxicillin 500mg',
            'generic_name' => 'Amoxicillin',
            'sku' => 'MED-AMX-500',
            'base_unit' => 'Strip',
            'selling_price' => 15000,
            'min_stock' => 5,
            'max_stock' => 100,
            'stock' => 50,
            'is_active' => true,
        ]);

        $this->batch = ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => 'BATCH-AMX-001',
            'stock_quantity' => 50,
            'purchase_price' => 10000,
            'expired_date' => now()->addYear()->toDateString(),
        ]);
    }

    public function test_cash_register_shift_split_payment_reconciliation()
    {
        // 1. Open shift
        $openResponse = $this->actingAs($this->user)->post(route('pos.shift.open'), [
            'opening_amount' => 100000,
        ]);
        $openResponse->assertRedirect(route('pos.index'));

        $shift = CashRegister::where('user_id', $this->user->id)->where('status', 'open')->first();
        $this->assertNotNull($shift);
        $this->assertEquals(100000, $shift->opening_amount);

        // 2. Transaction 1: Split payment "Cash: 50000 + QRIS: 25000", total 75000, change 0
        Sale::create([
            'invoice_number' => 'TRX-SPLIT-01',
            'user_id' => $this->user->id,
            'cash_register_id' => $shift->id,
            'total_amount' => 75000,
            'subtotal_amount' => 75000,
            'paid_amount' => 75000,
            'change_amount' => 0,
            'payment_method' => 'Cash: 50000 + QRIS: 25000',
            'sale_date' => now(),
        ]);

        // 3. Transaction 2: Split with change: Cash 60000, QRIS 20000, total 70000, change 10000
        Sale::create([
            'invoice_number' => 'TRX-SPLIT-02',
            'user_id' => $this->user->id,
            'cash_register_id' => $shift->id,
            'total_amount' => 70000,
            'subtotal_amount' => 70000,
            'paid_amount' => 80000,
            'change_amount' => 10000,
            'payment_method' => 'Cash: 60000 + QRIS: 20000',
            'sale_date' => now(),
        ]);

        // 4. Transaction 3: Cash only: 50000
        Sale::create([
            'invoice_number' => 'TRX-CASH-01',
            'user_id' => $this->user->id,
            'cash_register_id' => $shift->id,
            'total_amount' => 50000,
            'subtotal_amount' => 50000,
            'paid_amount' => 50000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => now(),
        ]);

        // 5. Transaction 4: QRIS only: 30000
        Sale::create([
            'invoice_number' => 'TRX-QRIS-01',
            'user_id' => $this->user->id,
            'cash_register_id' => $shift->id,
            'total_amount' => 30000,
            'subtotal_amount' => 30000,
            'paid_amount' => 30000,
            'change_amount' => 0,
            'payment_method' => 'QRIS',
            'sale_date' => now(),
        ]);

        // 6. Transaction 5: Deleted sale: Cash 100000 -> must NOT be counted
        $deletedSale = Sale::create([
            'invoice_number' => 'TRX-DEL-01',
            'user_id' => $this->user->id,
            'cash_register_id' => $shift->id,
            'total_amount' => 100000,
            'subtotal_amount' => 100000,
            'paid_amount' => 100000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => now(),
        ]);
        $deletedSale->delete();

        // Close shift
        $closeResponse = $this->actingAs($this->user)->post(route('pos.shift.close'), [
            'closing_amount' => 250000,
            'notes' => 'Rekonsiliasi shift sukses.',
        ]);
        $closeResponse->assertRedirect(route('dashboard'));

        $shift->refresh();
        $this->assertEquals('closed', $shift->status);

        // Expected System Cash:
        // TRX 1: 50,000
        // TRX 2: 60,000 - 10,000 = 50,000
        // TRX 3: 50,000
        // Total System Cash = 150,000
        $this->assertEquals(150000.0, (float) $shift->system_cash_amount);

        // Expected System QRIS:
        // TRX 1: 25,000
        // TRX 2: 20,000
        // TRX 4: 30,000
        // Total System QRIS = 75,000
        $this->assertEquals(75000.0, (float) $shift->system_qris_amount);

        // Check AuditLog recorded
        $log = AuditLog::where('module', 'pos_shift')->where('action', 'UPDATE')->first();
        $this->assertNotNull($log);
    }

    public function test_dashboard_excludes_soft_deleted_sales_from_top_products_and_payment_stats()
    {
        // 1. Active sale with 5 units of Amoxicillin
        $activeSale = Sale::create([
            'invoice_number' => 'TRX-ACT-01',
            'user_id' => $this->user->id,
            'total_amount' => 75000,
            'subtotal_amount' => 75000,
            'paid_amount' => 75000,
            'change_amount' => 0,
            'payment_method' => 'QRIS',
            'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $activeSale->id,
            'medicine_id' => $this->medicine->id,
            'batch_number' => $this->batch->batch_number,
            'quantity' => 5,
            'purchase_price' => 10000,
            'selling_price' => 15000,
            'subtotal' => 75000,
        ]);

        // 2. Soft-deleted sale with 999 units of Amoxicillin (deleted)
        $deletedSale = Sale::create([
            'invoice_number' => 'TRX-ACT-02',
            'user_id' => $this->user->id,
            'total_amount' => 9990000,
            'subtotal_amount' => 9990000,
            'paid_amount' => 9990000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $deletedSale->id,
            'medicine_id' => $this->medicine->id,
            'batch_number' => $this->batch->batch_number,
            'quantity' => 999,
            'purchase_price' => 10000,
            'selling_price' => 15000,
            'subtotal' => 9990000,
        ]);
        $deletedSale->delete();

        $response = $this->actingAs($this->user)->get(route('dashboard'));
        $response->assertStatus(200);

        $props = $response->getOriginalContent()->getData()['page']['props'];

        // Top products value must only be 5, not 1004
        $topProducts = collect($props['topProducts']);
        $product = $topProducts->firstWhere('name', $this->medicine->name);
        $this->assertNotNull($product);
        $this->assertEquals(5, (int) $product->value);

        // Payment stats for 'CASH' should not count the deleted sale
        $paymentDist = $props['paymentDistribution'];
        $cashStat = $paymentDist['CASH'] ?? null;
        $this->assertNull($cashStat); // Only QRIS exists
        $this->assertEquals(1, $paymentDist['QRIS']['count']);
    }

    public function test_sales_history_server_side_date_filter_timezone_asia_jakarta()
    {
        $todayJkt = now()->timezone('Asia/Jakarta')->toDateString();
        $yesterdayJkt = now()->timezone('Asia/Jakarta')->subDay()->toDateString();
        $customDate = '2026-05-15';

        // Sale today
        Sale::create([
            'invoice_number' => 'TRX-TODAY',
            'user_id' => $this->user->id,
            'total_amount' => 10000,
            'subtotal_amount' => 10000,
            'paid_amount' => 10000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => Carbon::parse($todayJkt . ' 10:00:00', 'Asia/Jakarta'),
        ]);

        // Sale yesterday
        Sale::create([
            'invoice_number' => 'TRX-YESTERDAY',
            'user_id' => $this->user->id,
            'total_amount' => 20000,
            'subtotal_amount' => 20000,
            'paid_amount' => 20000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => Carbon::parse($yesterdayJkt . ' 15:30:00', 'Asia/Jakarta'),
        ]);

        // Sale custom date
        Sale::create([
            'invoice_number' => 'TRX-CUSTOM',
            'user_id' => $this->user->id,
            'total_amount' => 30000,
            'subtotal_amount' => 30000,
            'paid_amount' => 30000,
            'change_amount' => 0,
            'payment_method' => 'Cash',
            'sale_date' => Carbon::parse($customDate . ' 09:00:00', 'Asia/Jakarta'),
        ]);

        // 1. Filter today
        $resToday = $this->actingAs($this->user)->get(route('sales.history', ['filter' => 'today']));
        $resToday->assertStatus(200);
        $dataToday = $resToday->getOriginalContent()->getData()['page']['props']['sales']['data'];
        $this->assertCount(1, $dataToday);
        $this->assertEquals('TRX-TODAY', $dataToday[0]['invoice_number']);

        // 2. Filter yesterday
        $resYest = $this->actingAs($this->user)->get(route('sales.history', ['filter' => 'yesterday']));
        $resYest->assertStatus(200);
        $dataYest = $resYest->getOriginalContent()->getData()['page']['props']['sales']['data'];
        $this->assertCount(1, $dataYest);
        $this->assertEquals('TRX-YESTERDAY', $dataYest[0]['invoice_number']);

        // 3. Filter custom
        $resCust = $this->actingAs($this->user)->get(route('sales.history', ['filter' => 'custom', 'date' => $customDate]));
        $resCust->assertStatus(200);
        $dataCust = $resCust->getOriginalContent()->getData()['page']['props']['sales']['data'];
        $this->assertCount(1, $dataCust);
        $this->assertEquals('TRX-CUSTOM', $dataCust[0]['invoice_number']);
    }

    public function test_stock_opname_creates_adjustment_and_updates_batch_and_medicine_stock()
    {
        $this->assertEquals(50, $this->batch->stock_quantity);
        $this->assertEquals(50, $this->medicine->stock);

        $response = $this->actingAs($this->user)->post(route('stock-adjustments.store'), [
            'product_batch_id' => $this->batch->id,
            'actual_stock' => 42,
            'type' => 'DAMAGE',
            'notes' => '8 strip rusak terkena rembesan air.',
        ]);

        $response->assertRedirect(route('stock-adjustments.index'));
        $response->assertSessionHas('success');

        $this->batch->refresh();
        $this->medicine->refresh();

        $this->assertEquals(42, $this->batch->stock_quantity);
        $this->assertEquals(42, $this->medicine->stock);

        $adj = StockAdjustment::where('product_batch_id', $this->batch->id)->first();
        $this->assertNotNull($adj);
        $this->assertEquals(50, $adj->system_stock);
        $this->assertEquals(42, $adj->actual_stock);
        $this->assertEquals(-8, $adj->difference);
        $this->assertEquals('DAMAGE', $adj->type);

        $log = AuditLog::where('module', 'stok')->where('action', 'UPDATE')->first();
        $this->assertNotNull($log);
    }
}
