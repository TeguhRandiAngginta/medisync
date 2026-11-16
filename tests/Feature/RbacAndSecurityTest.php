<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RbacAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $superadmin;
    protected User $apoteker;
    protected User $kasir;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $roleSuperadmin = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin']);
        $roleApoteker = Role::create(['name' => 'Apoteker', 'slug' => 'apoteker']);
        $roleKasir = Role::create(['name' => 'Kasir', 'slug' => 'kasir']);

        $this->branch = Branch::create([
            'code' => 'CBG-01',
            'name' => 'Cabang Utama',
            'address' => 'Jl. Merdeka No. 1',
            'phone' => '08123456789',
        ]);

        $this->superadmin = User::factory()->create([
            'role_id' => $roleSuperadmin->id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->apoteker = User::factory()->create([
            'role_id' => $roleApoteker->id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->kasir = User::factory()->create([
            'role_id' => $roleKasir->id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);
    }

    public function test_rbac_restricts_kasir_from_accessing_users_and_reports_and_purchases(): void
    {
        $this->actingAs($this->kasir)->get('/users')->assertStatus(403);
        $this->actingAs($this->kasir)->get('/reports')->assertStatus(403);
        $this->actingAs($this->kasir)->get('/purchases')->assertStatus(403);
    }

    public function test_rbac_restricts_apoteker_from_accessing_users_and_reports(): void
    {
        $this->actingAs($this->apoteker)->get('/users')->assertStatus(403);
        $this->actingAs($this->apoteker)->get('/reports')->assertStatus(403);
        $this->actingAs($this->apoteker)->get('/purchases')->assertOk();
    }

    public function test_rbac_allows_superadmin_full_access(): void
    {
        $this->actingAs($this->superadmin)->get('/users')->assertOk();
        $this->actingAs($this->superadmin)->get('/reports')->assertOk();
        $this->actingAs($this->superadmin)->get('/purchases')->assertOk();
    }

    public function test_purchase_and_sales_owner_check_returns_403_status(): void
    {
        $supplier = Supplier::create([
            'code' => 'SUP-01',
            'name' => 'PT Kimia',
            'phone' => '08123456',
            'address' => 'Jl. Obat',
        ]);

        $purchase = Purchase::create([
            'internal_receipt_number' => 'BPB-001',
            'invoice_number' => 'INV-001',
            'supplier_id' => $supplier->id,
            'user_id' => $this->superadmin->id,
            'purchase_date' => now()->toDateString(),
            'total_amount' => 10000,
            'status' => 'completed',
        ]);

        // Apoteker cannot delete purchase (requires superadmin/owner) -> returns HTTP 403
        $response = $this->actingAs($this->apoteker)->delete(route('purchases.destroy', $purchase));
        $response->assertStatus(403);
    }

    public function test_product_destroy_rejected_when_active_batch_or_history_exists(): void
    {
        $category = MedicineCategory::create(['name' => 'Antibiotik', 'is_active' => true]);
        $supplier = Supplier::create([
            'code' => 'SUP-02',
            'name' => 'PT Farma',
            'phone' => '08123457',
            'address' => 'Jl. Obat',
        ]);

        $medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'sku' => 'MED-AMX-500',
            'name' => 'Amoxicillin 500mg',
            'base_unit' => 'Kapsul',
            'selling_price' => 5000,
            'min_stock' => 5,
            'max_stock' => 100,
            'is_active' => true,
        ]);

        ProductBatch::create([
            'medicine_id' => $medicine->id,
            'batch_number' => 'AMX-001',
            'stock_quantity' => 10,
            'expired_date' => now()->addYear()->toDateString(),
            'purchase_price' => 3000,
        ]);

        $response = $this->actingAs($this->superadmin)->delete(route('products.destroy', $medicine));
        $response->assertSessionHasErrors(['message']);
        $this->assertDatabaseHas('medicines', ['id' => $medicine->id]);
    }

    public function test_product_destroy_succeeds_when_no_history_exists(): void
    {
        $category = MedicineCategory::create(['name' => 'Vitamin', 'is_active' => true]);
        $medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'sku' => 'MED-VIT-001',
            'name' => 'Vitamin C 500mg',
            'base_unit' => 'Tablet',
            'selling_price' => 2000,
            'min_stock' => 5,
            'max_stock' => 100,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superadmin)->delete(route('products.destroy', $medicine));
        $response->assertSessionHasNoErrors();
        $this->assertSoftDeleted('medicines', ['id' => $medicine->id]);
    }

    public function test_user_destroy_deactivates_user_when_transaction_history_exists(): void
    {
        $shiftUser = User::factory()->create([
            'role_id' => $this->kasir->role_id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        CashRegister::create([
            'user_id' => $shiftUser->id,
            'branch_id' => $this->branch->id,
            'opening_amount' => 50000,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->superadmin)->delete(route('users.destroy', $shiftUser));
        $response->assertSessionHas('success');

        // User should NOT be hard-deleted, but is_active changed to false
        $this->assertDatabaseHas('users', [
            'id' => $shiftUser->id,
            'is_active' => false,
        ]);
    }

    public function test_user_destroy_hard_deletes_when_no_history_exists(): void
    {
        $freshUser = User::factory()->create([
            'role_id' => $this->kasir->role_id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superadmin)->delete(route('users.destroy', $freshUser));
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $freshUser->id]);
    }
}
