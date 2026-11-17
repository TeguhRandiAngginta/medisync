<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Omzet seluruh toko hanya untuk superadmin; kasir/apoteker hanya melihat transaksinya sendiri.
 */
class DashboardScopeTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $kasir1;
    protected User $kasir2;
    protected Branch $branch;
    protected MedicineCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->admin = $this->user('superadmin');
        $this->kasir1 = $this->user('kasir');
        $this->kasir2 = $this->user('kasir');

        $this->sale($this->kasir1, 'INV-K1', 'ObatSatu', 1, 10000);
        $this->sale($this->kasir2, 'INV-K2', 'ObatDua', 5, 10000);
    }

    private function user(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);

        return User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->branch->id, 'is_active' => true]);
    }

    private function sale(User $user, string $invoice, string $medicineName, int $qty, int $price): void
    {
        $medicine = Medicine::create([
            'medicine_category_id' => $this->category->id, 'name' => $medicineName, 'sku' => 'SKU-' . strtoupper(uniqid()),
            'base_unit' => 'Tablet', 'selling_price' => $price, 'min_stock' => 1, 'is_active' => true,
        ]);
        $sale = Sale::create([
            'invoice_number' => $invoice, 'user_id' => $user->id, 'total_amount' => $qty * $price,
            'subtotal_amount' => $qty * $price, 'paid_amount' => $qty * $price, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $medicine->id, 'batch_number' => 'B1', 'quantity' => $qty,
            'selling_price' => $price, 'subtotal' => $qty * $price, 'purchase_price' => 5000,
        ]);
    }

    private function props(User $user): array
    {
        return $this->actingAs($user)->get(route('dashboard'))->assertOk()->viewData('page')['props'];
    }

    public function test_kasir_only_sees_own_sales_on_dashboard(): void
    {
        $props = $this->props($this->kasir1);

        $this->assertSame('own', $props['scope']);
        $this->assertEquals(10000, $props['stats']['todayRevenue']);
        $this->assertSame(1, $props['stats']['todayTransactions']);
        $this->assertSame(['INV-K1'], collect($props['recentTransactions'])->pluck('invoice_number')->all());
        $this->assertSame(['ObatSatu'], collect($props['topProducts'])->pluck('name')->all());
        $this->assertSame(1, collect($props['paymentDistribution'])->sum('count'));
        $this->assertEquals(10000, collect($props['chartData'])->sum('total'));
    }

    public function test_superadmin_sees_store_wide_data_on_dashboard(): void
    {
        $props = $this->props($this->admin);

        $this->assertSame('all', $props['scope']);
        $this->assertEquals(60000, $props['stats']['todayRevenue']);
        $this->assertSame(2, $props['stats']['todayTransactions']);
        $this->assertEqualsCanonicalizing(['INV-K1', 'INV-K2'], collect($props['recentTransactions'])->pluck('invoice_number')->all());
        $this->assertEqualsCanonicalizing(['ObatSatu', 'ObatDua'], collect($props['topProducts'])->pluck('name')->all());
    }

    public function test_apoteker_is_scoped_to_own_sales_too(): void
    {
        $props = $this->props($this->user('apoteker'));

        $this->assertSame('own', $props['scope']);
        $this->assertEquals(0, $props['stats']['todayRevenue']);
        $this->assertSame([], collect($props['recentTransactions'])->all());
    }
}
