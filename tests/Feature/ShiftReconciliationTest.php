<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Shift kasir: satu shift terbuka per user dan rekonsiliasi pembayaran (termasuk split & desimal).
 */
class ShiftReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Kasir', 'slug' => 'kasir', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
        $category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id, 'name' => 'Obat', 'sku' => 'SKU1', 'base_unit' => 'Tablet',
            'selling_price' => 10000, 'min_stock' => 1, 'is_active' => true,
        ]);
        ProductBatch::create([
            'medicine_id' => $this->medicine->id, 'batch_number' => 'B1', 'stock_quantity' => 1000,
            'expired_date' => now()->addYear()->toDateString(), 'purchase_price' => 5000,
        ]);
        $this->actingAs($this->user);
    }

    private function open(): void
    {
        $this->post(route('pos.shift.open'), ['opening_amount' => 100000]);
    }

    private function sell(int $qty, array $payments)
    {
        return $this->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => $qty]],
            'payments' => $payments,
        ]);
    }

    private function close(): CashRegister
    {
        $this->post(route('pos.shift.close'), ['closing_amount' => 0])->assertSessionHasNoErrors();

        return CashRegister::latest('id')->firstOrFail();
    }

    public function test_user_cannot_have_two_open_shifts(): void
    {
        $this->open();
        $this->open(); // klik ganda

        $this->assertSame(1, CashRegister::where('user_id', $this->user->id)->where('status', 'open')->count());
    }

    public function test_database_rejects_second_open_shift_for_same_user(): void
    {
        $this->open();

        $this->expectException(QueryException::class);
        CashRegister::create(['user_id' => $this->user->id, 'opened_at' => now(), 'opening_amount' => 0, 'status' => 'open']);
    }

    public function test_split_payment_is_reconciled_exactly(): void
    {
        $this->open();
        // total 50.000: tunai 30.000 + QRIS 25.000 = 55.000, kembalian 5.000 dari tunai
        $this->sell(5, ['cash' => 30000, 'qris' => 25000])->assertSessionHasNoErrors();

        $sale = Sale::firstOrFail();
        $this->assertSame('Cash: 30000 + QRIS: 25000', $sale->payment_method);
        $this->assertEquals(55000, $sale->paid_amount);
        $this->assertEquals(5000, $sale->change_amount);

        $shift = $this->close();
        $this->assertEquals(25000, $shift->system_cash_amount);   // 30.000 - kembalian 5.000
        $this->assertEquals(25000, $shift->system_qris_amount);
        $this->assertEquals(0, $shift->system_transfer_amount);
    }

    public function test_decimal_amounts_are_not_inflated(): void
    {
        $this->medicine->update(['selling_price' => 12500.50]);
        $this->open();
        $this->sell(1, ['cash' => 12500.5])->assertSessionHasNoErrors();

        $shift = $this->close();
        $this->assertEquals(12500.5, $shift->system_cash_amount); // bukan 125005
    }

    public function test_legacy_sale_with_decimal_in_payment_method_string_is_parsed_correctly(): void
    {
        $this->open();
        $shift = CashRegister::firstOrFail();
        Sale::create([
            'invoice_number' => 'INV-OLD', 'user_id' => $this->user->id, 'cash_register_id' => $shift->id,
            'total_amount' => 12600.5, 'subtotal_amount' => 12600.5, 'paid_amount' => 12600.5, 'change_amount' => 0,
            'payment_method' => 'Cash: 12500.5 + QRIS: 100', 'sale_date' => now(),
        ]);

        $closed = $this->close();
        $this->assertEquals(12500.5, $closed->system_cash_amount);
        $this->assertEquals(100, $closed->system_qris_amount);
    }

    public function test_change_cannot_exceed_cash_received(): void
    {
        $this->open();

        $this->sell(5, ['qris' => 60000])->assertSessionHasErrors('message'); // lebih bayar via QRIS tanpa tunai
        $this->sell(5, ['cash' => 10000])->assertSessionHasErrors('message'); // kurang bayar

        $this->assertSame(0, Sale::count());
    }

    private function closeWith(float $physical): CashRegister
    {
        $this->post(route('pos.shift.close'), ['closing_amount' => $physical])->assertSessionHasNoErrors();

        return CashRegister::latest('id')->firstOrFail();
    }

    public function test_close_shift_cash_matches_when_opening_plus_cash_sales_equals_physical(): void
    {
        $this->open();                                   // modal awal 100.000
        $this->sell(5, ['cash' => 50000]);               // tunai 50.000
        $shift = $this->closeWith(150000);

        $this->assertEquals(150000, $shift->expected_cash_amount);
        $this->assertEquals(0, $shift->cash_difference);
        $this->assertStringContainsString('sesuai', session('success'));
    }

    public function test_close_shift_records_shortage_and_overage(): void
    {
        $this->open();
        $this->sell(5, ['cash' => 50000]);
        $short = $this->closeWith(140000);

        $this->assertEquals(-10000, $short->cash_difference);
        $this->assertStringContainsString('kurang Rp 10.000', session('success'));
        $this->assertTrue(\App\Models\AuditLog::where('module', 'pos_shift')
            ->where('description', 'like', '%Selisih: kurang Rp 10.000%')->exists());

        $this->open();
        $this->sell(5, ['cash' => 50000]);
        $over = $this->closeWith(160000);

        $this->assertEquals(10000, $over->cash_difference);
        $this->assertStringContainsString('lebih Rp 10.000', session('success'));
    }

    public function test_non_cash_sales_do_not_count_toward_expected_drawer_cash(): void
    {
        $this->open();
        $this->sell(5, ['qris' => 50000]);               // QRIS tidak masuk laci
        $shift = $this->closeWith(100000);

        $this->assertEquals(100000, $shift->expected_cash_amount);
        $this->assertEquals(0, $shift->cash_difference);
    }

    public function test_change_given_is_subtracted_from_expected_cash(): void
    {
        $this->open();
        $this->sell(5, ['cash' => 100000]);              // total 50.000, kembalian 50.000 => tunai bersih 50.000
        $shift = $this->closeWith(150000);

        $this->assertEquals(150000, $shift->expected_cash_amount);
        $this->assertEquals(0, $shift->cash_difference);
    }
}
