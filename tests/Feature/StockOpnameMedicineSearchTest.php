<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Form opname tidak memuat seluruh katalog: daftar awal dibatasi dan pencarian dilakukan di server.
 */
class StockOpnameMedicineSearchTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected MedicineCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
    }

    private function user(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);

        return User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->branch->id, 'is_active' => true]);
    }

    private function medicine(string $name, ?string $generic = null, ?string $sku = null): Medicine
    {
        return Medicine::create([
            'medicine_category_id' => $this->category->id, 'name' => $name, 'generic_name' => $generic,
            'sku' => $sku ?? 'SKU-' . strtoupper(uniqid()), 'base_unit' => 'Tablet', 'selling_price' => 1000,
            'min_stock' => 1, 'is_active' => true,
        ]);
    }

    private function search(User $user, string $q): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user)->getJson(route('api.stock-adjustments.medicines', ['q' => $q]));
    }

    public function test_create_page_only_loads_a_limited_initial_list(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $this->medicine(sprintf('Obat %02d', $i));
        }

        $props = $this->actingAs($this->user('superadmin'))->get(route('stock-adjustments.create'))
            ->assertOk()->viewData('page')['props'];

        $this->assertCount(20, $props['medicines']);
        $this->assertSame('Obat 01', $props['medicines'][0]['name']);
    }

    public function test_search_matches_name_sku_and_generic_name_case_insensitively(): void
    {
        $admin = $this->user('superadmin');
        $this->medicine('Panadol Extra', 'Paracetamol', 'PAN-001');
        $this->medicine('Bodrex', 'Aspirin', 'BDX-002');

        $this->assertSame(['Panadol Extra'], $this->search($admin, 'panadol')->assertOk()->json('*.name'));
        $this->assertSame(['Panadol Extra'], $this->search($admin, 'pan-001')->json('*.name'));
        $this->assertSame(['Panadol Extra'], $this->search($admin, 'PARACETAMOL')->json('*.name'));
        $this->assertSame([], $this->search($admin, 'tidak-ada')->json());
    }

    public function test_search_is_limited_and_wildcards_are_not_expanded(): void
    {
        $admin = $this->user('superadmin');
        for ($i = 1; $i <= 25; $i++) {
            $this->medicine(sprintf('Vitamin %02d', $i));
        }
        $this->medicine('Obat Lain');

        $this->assertCount(20, $this->search($admin, 'vitamin')->json());
        $this->assertSame([], $this->search($admin, '%')->json(), '% dari input tidak boleh menjadi wildcard.');
        $this->assertSame([], $this->search($admin, '_')->json());
        $this->assertSame([], $this->search($admin, '!')->json(), 'Karakter escape sendiri juga harus aman.');
    }

    public function test_search_returns_active_batches_ordered_by_expiry(): void
    {
        $admin = $this->user('superadmin');
        $medicine = $this->medicine('Amoxicillin');
        ProductBatch::create(['medicine_id' => $medicine->id, 'batch_number' => 'LATE', 'stock_quantity' => 5, 'expired_date' => now()->addYear()->toDateString(), 'purchase_price' => 1]);
        ProductBatch::create(['medicine_id' => $medicine->id, 'batch_number' => 'EARLY', 'stock_quantity' => 5, 'expired_date' => now()->addMonths(3)->toDateString(), 'purchase_price' => 1]);
        $gone = ProductBatch::create(['medicine_id' => $medicine->id, 'batch_number' => 'GONE', 'stock_quantity' => 5, 'expired_date' => now()->addMonths(6)->toDateString(), 'purchase_price' => 1]);
        $gone->delete();

        $batches = $this->search($admin, 'amox')->json('0.batches');

        $this->assertSame(['EARLY', 'LATE'], array_column($batches, 'batch_number'));
    }

    public function test_search_is_restricted_to_pharmacy_roles(): void
    {
        $this->medicine('Amoxicillin');

        $this->search($this->user('kasir'), 'amox')->assertForbidden();
        $this->search($this->user('apoteker'), 'amox')->assertOk();

        auth()->logout();
        $this->getJson(route('api.stock-adjustments.medicines', ['q' => 'amox']))->assertUnauthorized();
    }

    public function test_search_rejects_overlong_query(): void
    {
        $this->search($this->user('superadmin'), str_repeat('a', 101))->assertStatus(422);
    }
}
