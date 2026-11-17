<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\LocationType;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Purchase;
use App\Models\Rack;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Data referensi yang masih dipakai data aktif tidak boleh dipindahkan ke trash
 * (relasinya akan kosong di UI). Setelah pemakainya dihapus, soft delete diizinkan.
 */
class ReferenceDeleteGuardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Branch $branch;
    protected MedicineCategory $category;
    protected SupplierType $supplierType;
    protected LocationType $locationType;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'x']);
        $this->branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->admin = User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->branch->id, 'is_active' => true]);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->supplierType = SupplierType::create(['name' => 'PBF', 'prefix_code' => 'PBF']);
        $this->locationType = LocationType::create(['name' => 'Rak', 'prefix_code' => 'RK']);
        $this->actingAs($this->admin);
    }

    private function supplier(string $code): Supplier
    {
        return Supplier::create(['supplier_type_id' => $this->supplierType->id, 'code' => $code, 'name' => "Pemasok {$code}", 'is_active' => true]);
    }

    private function rack(string $code): Rack
    {
        return Rack::create(['branch_id' => $this->branch->id, 'location_type_id' => $this->locationType->id, 'code' => $code, 'name' => "Rak {$code}", 'is_active' => true]);
    }

    private function medicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'medicine_category_id' => $this->category->id, 'name' => 'Obat ' . uniqid(), 'sku' => 'SKU-' . strtoupper(uniqid()),
            'base_unit' => 'Tablet', 'selling_price' => 1000, 'min_stock' => 1, 'is_active' => true,
        ], $overrides));
    }

    // ---- Pemasok

    public function test_supplier_in_use_by_active_medicine_cannot_be_trashed_until_medicine_is_removed(): void
    {
        $supplier = $this->supplier('S1');
        $medicine = $this->medicine(['supplier_id' => $supplier->id]);

        $this->delete(route('suppliers.destroy', $supplier->id))->assertSessionHasErrors('message');
        $this->assertNull($supplier->fresh()->deleted_at);

        $medicine->delete();
        $this->delete(route('suppliers.destroy', $supplier->id))->assertSessionHasNoErrors();
        $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
    }

    public function test_supplier_bulk_skips_used_and_reports_them(): void
    {
        $used = $this->supplier('USED');
        $free = $this->supplier('FREE');
        $this->medicine(['supplier_id' => $used->id]);

        $this->post(route('suppliers.bulk-destroy'), ['ids' => [$used->id, $free->id]])->assertSessionHasNoErrors();

        $this->assertNull($used->fresh()->deleted_at);
        $this->assertSoftDeleted('suppliers', ['id' => $free->id]);
        $this->assertStringContainsString('Dilewati', session('success'));
        $this->assertStringContainsString('1 obat aktif', session('success'));
    }

    public function test_supplier_bulk_with_only_used_items_returns_error(): void
    {
        $used = $this->supplier('USED');
        $this->medicine(['supplier_id' => $used->id]);

        $this->post(route('suppliers.bulk-destroy'), ['ids' => [$used->id]])->assertSessionHasErrors('message');
        $this->assertNull($used->fresh()->deleted_at);
    }

    // ---- Rak

    public function test_rack_in_use_cannot_be_trashed_and_bulk_skips_it(): void
    {
        $used = $this->rack('R1');
        $free = $this->rack('R2');
        $this->medicine(['rack_id' => $used->id]);

        $this->delete(route('racks.destroy', $used->id))->assertSessionHasErrors('message');
        $this->assertNull($used->fresh()->deleted_at);

        $this->post(route('racks.bulk-destroy'), ['ids' => [$used->id, $free->id]])->assertSessionHasNoErrors();
        $this->assertNull($used->fresh()->deleted_at);
        $this->assertSoftDeleted('racks', ['id' => $free->id]);
    }

    // ---- Golongan obat

    public function test_medicine_category_in_use_cannot_be_trashed(): void
    {
        $this->medicine();

        $this->delete(route('references.medicine-categories.destroy', $this->category->id))->assertSessionHasErrors('message');
        $this->assertNull($this->category->fresh()->deleted_at);

        $this->post(route('references.medicine-categories.bulk-destroy'), ['ids' => [$this->category->id]])->assertSessionHasErrors('message');
        $this->assertNull($this->category->fresh()->deleted_at);

        $unused = MedicineCategory::create(['name' => 'Kosong', 'is_active' => true]);
        $this->delete(route('references.medicine-categories.destroy', $unused->id))->assertSessionHasNoErrors();
        $this->assertSoftDeleted('medicine_categories', ['id' => $unused->id]);
    }

    // ---- Tipe lokasi & tipe supplier

    public function test_location_type_in_use_by_active_rack_cannot_be_trashed(): void
    {
        $rack = $this->rack('R1');

        $this->delete(route('references.location-types.destroy', $this->locationType->id))->assertSessionHasErrors('message');
        $this->assertNull($this->locationType->fresh()->deleted_at);

        $rack->delete();
        $this->delete(route('references.location-types.destroy', $this->locationType->id))->assertSessionHasNoErrors();
        $this->assertSoftDeleted('location_types', ['id' => $this->locationType->id]);
    }

    public function test_supplier_type_in_use_by_active_supplier_cannot_be_trashed(): void
    {
        $this->supplier('S1');

        $this->delete(route('references.supplier-types.destroy', $this->supplierType->id))->assertSessionHasErrors('message');
        $this->post(route('references.supplier-types.bulk-destroy'), ['ids' => [$this->supplierType->id]])->assertSessionHasErrors('message');
        $this->assertNull($this->supplierType->fresh()->deleted_at);
    }

    // ---- Riwayat tetap menampilkan nama referensi yang sudah di-trash

    public function test_purchase_history_still_shows_name_of_trashed_supplier(): void
    {
        $supplier = $this->supplier('HIST');
        Purchase::create([
            'internal_receipt_number' => 'BPB-1', 'invoice_number' => 'FAKTUR-1', 'supplier_id' => $supplier->id,
            'user_id' => $this->admin->id, 'purchase_date' => now()->toDateString(), 'total_amount' => 100, 'status' => 'completed',
        ]);
        $supplier->delete();

        $props = $this->get('/purchases')->assertOk()->viewData('page')['props'];

        $this->assertSame('Pemasok HIST', $props['purchases']['data'][0]['supplier']['name']);
    }
}
