<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Riwayat penjualan: kasir/apoteker hanya melihat transaksinya sendiri dan tidak bisa membuka trash.
 */
class SalesHistoryScopeTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected User $admin;
    protected User $kasir1;
    protected User $kasir2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->admin = $this->user('superadmin');
        $this->kasir1 = $this->user('kasir');
        $this->kasir2 = $this->user('kasir');

        $this->sale($this->kasir1, 'INV-K1');
        $this->sale($this->kasir2, 'INV-K2');
        $this->sale($this->kasir2, 'INV-K2-TRASH')->delete();
    }

    private function user(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);

        return User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->branch->id, 'is_active' => true]);
    }

    private function sale(User $user, string $invoice): Sale
    {
        return Sale::create([
            'invoice_number' => $invoice, 'user_id' => $user->id, 'total_amount' => 10000, 'subtotal_amount' => 10000,
            'paid_amount' => 10000, 'change_amount' => 0, 'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
    }

    private function invoices(User $user, array $query = []): array
    {
        $page = $this->actingAs($user)->get(route('sales.history', $query))->assertOk()->viewData('page')['props'];

        return collect($page['sales']['data'])->pluck('invoice_number')->all();
    }

    public function test_kasir_only_sees_own_sales(): void
    {
        $this->assertSame(['INV-K1'], $this->invoices($this->kasir1));
        $this->assertSame(['INV-K2'], $this->invoices($this->kasir2));
    }

    public function test_apoteker_does_not_see_other_users_sales(): void
    {
        $this->assertSame([], $this->invoices($this->user('apoteker')));
    }

    public function test_superadmin_sees_all_active_sales_and_trash(): void
    {
        $this->assertEqualsCanonicalizing(['INV-K1', 'INV-K2'], $this->invoices($this->admin));
        $this->assertSame(['INV-K2-TRASH'], $this->invoices($this->admin, ['trashed' => 1]));
    }

    public function test_kasir_cannot_open_trash_and_trash_count_is_hidden(): void
    {
        $this->actingAs($this->kasir2)->get(route('sales.history', ['trashed' => 1]))->assertForbidden();
        $this->actingAs($this->kasir2)->get(route('sales.trash'))->assertForbidden();

        $props = $this->actingAs($this->kasir2)->get(route('sales.history'))->viewData('page')['props'];
        $this->assertSame(0, $props['trashedCount']);
        $this->assertFalse($props['canManage']);
    }
}
