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

class PosReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id, 'name' => 'ParacetamolStruk', 'sku' => 'SKU1', 'base_unit' => 'Tablet',
            'selling_price' => 10000, 'min_stock' => 1, 'is_active' => true,
        ]);
    }

    private function user(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);

        return User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->branch->id, 'is_active' => true]);
    }

    private function sale(User $user, string $invoice): Sale
    {
        $sale = Sale::create([
            'invoice_number' => $invoice, 'user_id' => $user->id, 'total_amount' => 20000, 'subtotal_amount' => 20000,
            'paid_amount' => 25000, 'change_amount' => 5000, 'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $this->medicine->id, 'batch_number' => 'B1', 'quantity' => 2,
            'selling_price' => 10000, 'subtotal' => 20000, 'purchase_price' => 4000,
        ]);

        return $sale;
    }

    public function test_cashier_can_print_own_receipt(): void
    {
        $kasir = $this->user('kasir');
        $this->sale($kasir, 'INV-OWN');

        $this->actingAs($kasir)->get(route('pos.receipt', 'INV-OWN'))
            ->assertOk()
            ->assertSee('INV-OWN')
            ->assertSee('ParacetamolStruk')
            ->assertSee('20.000');
    }

    public function test_cashier_cannot_print_other_users_receipt(): void
    {
        $this->sale($this->user('kasir'), 'INV-OTHER');

        $this->actingAs($this->user('kasir'))->get(route('pos.receipt', 'INV-OTHER'))->assertNotFound();
    }

    public function test_superadmin_can_print_any_receipt(): void
    {
        $this->sale($this->user('kasir'), 'INV-ANY');

        $this->actingAs($this->user('superadmin'))->get(route('pos.receipt', 'INV-ANY'))->assertOk()->assertSee('INV-ANY');
    }

    public function test_trashed_sale_and_unknown_invoice_return_404_and_guest_is_redirected(): void
    {
        $kasir = $this->user('kasir');
        $this->sale($kasir, 'INV-GONE')->delete();

        $this->actingAs($kasir)->get(route('pos.receipt', 'INV-GONE'))->assertNotFound();
        $this->actingAs($kasir)->get(route('pos.receipt', 'INV-NONE'))->assertNotFound();

        auth()->logout();
        $this->get(route('pos.receipt', 'INV-GONE'))->assertRedirect(route('login'));
    }

    public function test_receipt_still_renders_when_medicine_was_trashed(): void
    {
        $kasir = $this->user('kasir');
        $this->sale($kasir, 'INV-TRASHMED');
        $this->medicine->delete();

        $this->actingAs($kasir)->get(route('pos.receipt', 'INV-TRASHMED'))->assertOk()->assertSee('ParacetamolStruk');
    }
}
