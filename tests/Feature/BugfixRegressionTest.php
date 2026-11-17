<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\ProductBatch;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Regresi untuk bug hasil screening (lihat CHANGELOG.md).
 */
class BugfixRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'Superadmin']);
        $branch = Branch::create(['code' => 'CBG-01', 'name' => 'Cabang', 'address' => 'Jl. A', 'phone' => '0812']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);

        $category = MedicineCategory::create(['name' => 'Obat Bebas', 'is_active' => true]);
        $this->medicine = Medicine::create([
            'medicine_category_id' => $category->id,
            'name' => 'Paracetamol 500mg',
            'sku' => 'MED-PCT-500',
            'base_unit' => 'Tablet',
            'selling_price' => 10000,
            'min_stock' => 5,
            'is_active' => true,
        ]);
    }

    private function batch(string $number, int $stock, string $expired): ProductBatch
    {
        return ProductBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_number' => $number,
            'stock_quantity' => $stock,
            'expired_date' => $expired,
            'purchase_price' => 5000,
        ]);
    }

    public function test_fefo_skips_expired_batches(): void
    {
        $expired = $this->batch('EXP', 5, now()->subDay()->toDateString());
        $valid = $this->batch('OK', 5, now()->addMonths(6)->toDateString());

        $result = InventoryService::deductStockFEFO($this->medicine->id, 3);

        $this->assertSame('OK', $result['batch_number']);
        $this->assertEquals(5, $expired->fresh()->stock_quantity);
        $this->assertEquals(2, $valid->fresh()->stock_quantity);

        // Sisa valid hanya 2: batch kedaluwarsa tidak boleh menutup kekurangan.
        $this->expectExceptionMessage('tidak mencukupi');
        InventoryService::deductStockFEFO($this->medicine->id, 3);
    }

    public function test_delete_restore_delete_does_not_inflate_stock(): void
    {
        $batch = $this->batch('B1', 10, now()->addYear()->toDateString());
        $this->medicine->update(['stock' => 10]);

        $sale = Sale::create([
            'invoice_number' => 'INV-X', 'user_id' => $this->user->id, 'total_amount' => 40000,
            'subtotal_amount' => 40000, 'paid_amount' => 40000, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        $deduction = InventoryService::deductStockFEFO($this->medicine->id, 4);
        $detail = SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $this->medicine->id, 'batch_number' => 'B1',
            'quantity' => 4, 'selling_price' => 10000, 'subtotal' => 40000, 'purchase_price' => 5000,
        ]);
        InventoryService::recordSaleDetailBatches($detail->id, $deduction['batches']);
        $this->assertEquals(6, $batch->fresh()->stock_quantity);

        $sale->delete();
        $this->assertEquals(10, $batch->fresh()->stock_quantity);

        $sale->restore();
        $this->assertEquals(6, $batch->fresh()->stock_quantity);

        $sale->delete();
        $this->assertEquals(10, $batch->fresh()->stock_quantity, 'Stok tidak boleh membengkak setelah hapus-pulihkan-hapus.');
        $this->assertSame(1, DB::table('sale_detail_batches')->where('sale_detail_id', $detail->id)->count());
    }

    public function test_restore_with_insufficient_stock_returns_error_not_500(): void
    {
        $batch = $this->batch('B1', 4, now()->addYear()->toDateString());
        $sale = Sale::create([
            'invoice_number' => 'INV-Y', 'user_id' => $this->user->id, 'total_amount' => 40000,
            'subtotal_amount' => 40000, 'paid_amount' => 40000, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $this->medicine->id, 'batch_number' => 'B1',
            'quantity' => 4, 'selling_price' => 10000, 'subtotal' => 40000, 'purchase_price' => 5000,
        ]);
        $sale->delete();                       // stok batch jadi 8
        $batch->update(['stock_quantity' => 0]); // stok habis terjual di tempat lain

        $response = $this->actingAs($this->user)->post(route('sales.restore', $sale->id));

        $response->assertSessionHasErrors(['message']);
        $this->assertSoftDeleted('sales', ['id' => $sale->id]);

        $response = $this->actingAs($this->user)->post(route('sales.bulk-restore'), ['ids' => [$sale->id]]);
        $response->assertSessionHasErrors(['message']);
    }

    private function openShift(): void
    {
        CashRegister::create([
            'user_id' => $this->user->id, 'branch_id' => $this->user->branch_id,
            'opening_amount' => 0, 'opened_at' => now(), 'status' => 'open',
        ]);
    }

    public function test_pos_uses_server_price_and_computes_change(): void
    {
        $this->openShift();
        $this->batch('B1', 10, now()->addYear()->toDateString());

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => 2, 'price' => 1]], // harga palsu dari klien
            'paid_amount' => 30000,
            'change_amount' => 999999,                                               // kembalian palsu
            'payment_method' => 'Cash',
        ])->assertSessionHasNoErrors();

        $sale = Sale::firstOrFail();
        $this->assertEquals(20000, $sale->total_amount);
        $this->assertEquals(10000, $sale->change_amount);
        $this->assertEquals(10000, $sale->details()->first()->selling_price);
    }

    public function test_pos_rejects_underpayment_and_unknown_medicine(): void
    {
        $this->openShift();
        $batch = $this->batch('B1', 10, now()->addYear()->toDateString());

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => 2, 'price' => 10000]],
            'paid_amount' => 5000, 'payment_method' => 'Cash',
        ])->assertSessionHasErrors(['message']);

        $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => 99999, 'quantity' => 1, 'price' => 1]],
            'paid_amount' => 5000, 'payment_method' => 'Cash',
        ])->assertSessionHasErrors(['message']);

        $this->assertSame(0, Sale::count());
        $this->assertEquals(10, $batch->fresh()->stock_quantity);
    }

    public function test_deactivated_user_loses_existing_session(): void
    {
        $this->actingAs($this->user)->get(route('dashboard'))->assertOk();

        $this->user->update(['is_active' => false]);

        $this->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_user_with_history_cannot_delete_own_account(): void
    {
        Sale::create([
            'invoice_number' => 'INV-Z', 'user_id' => $this->user->id, 'total_amount' => 1,
            'subtotal_amount' => 1, 'paid_amount' => 1, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);

        $this->actingAs($this->user)
            ->delete('/profile', ['password' => 'password'])
            ->assertSessionHasErrors('password');

        $this->assertNotNull(User::find($this->user->id));
        $this->assertAuthenticated();
    }

    public function test_prescription_edit_then_trash_restore_has_no_ghost_items(): void
    {
        $p = \App\Models\Prescription::create([
            'prescription_number' => 'RSP-T-001', 'patient_name' => 'A', 'doctor_name' => 'B',
            'prescription_date' => now()->toDateString(), 'status' => 'DRAFT', 'user_id' => $this->user->id,
        ]);
        \App\Models\PrescriptionItem::create(['prescription_id' => $p->id, 'medicine_id' => $this->medicine->id, 'quantity' => 1, 'signa' => '1x1']);

        $this->actingAs($this->user)->put(route('prescriptions.update', $p->id), [
            'patient_name' => 'A', 'doctor_name' => 'B', 'prescription_date' => now()->toDateString(),
            'items' => [['medicine_id' => $this->medicine->id, 'quantity' => 5, 'signa' => '3x1']],
        ])->assertSessionHasNoErrors();

        $this->actingAs($this->user)->delete(route('prescriptions.destroy', $p->id));
        $this->actingAs($this->user)->post(route('prescriptions.restore', $p->id));

        $items = \App\Models\PrescriptionItem::where('prescription_id', $p->id)->get();
        $this->assertCount(1, $items);
        $this->assertEquals(5, $items->first()->quantity);
    }

    public function test_gemini_error_never_exposes_api_key(): void
    {
        config(['services.google_ai.api_key' => 'SECRET-KEY-123']);
        \Illuminate\Support\Facades\Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException(
                'cURL error 28: timeout for https://generativelanguage.googleapis.com/v1beta/models/x:generateContent?key=SECRET-KEY-123'
            );
        });

        try {
            \App\Services\GoogleAIService::generateContent('halo');
            $this->fail('Harus melempar exception');
        } catch (\Exception $e) {
            $this->assertStringNotContainsString('SECRET-KEY-123', $e->getMessage());
        }
    }

    public function test_invoice_number_is_shared_to_inertia_flash(): void
    {
        $this->openShift();
        $this->batch('B1', 10, now()->addYear()->toDateString());

        $response = $this->actingAs($this->user)->post(route('pos.store'), [
            'cart' => [['id' => $this->medicine->id, 'quantity' => 1]],
            'paid_amount' => 10000, 'payment_method' => 'Cash',
        ]);
        $response->assertSessionHas('invoice_number');

        $page = $this->actingAs($this->user)->withSession(['invoice_number' => 'TRX-1'])->get(route('pos.index'));
        $this->assertSame('TRX-1', $page->viewData('page')['props']['flash']['invoice_number'] ?? null);
    }

    private function userWithRole(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'description' => $slug]);
        return User::factory()->create(['role_id' => $role->id, 'branch_id' => $this->user->branch_id, 'is_active' => true]);
    }

    private function prescription(string $status = 'DRAFT', ?string $attachment = null): \App\Models\Prescription
    {
        return \App\Models\Prescription::create([
            'prescription_number' => 'RSP-' . uniqid(), 'patient_name' => 'A', 'doctor_name' => 'B',
            'prescription_date' => now()->toDateString(), 'status' => $status,
            'attachment' => $attachment, 'user_id' => $this->user->id,
        ]);
    }

    public function test_kasir_cannot_delete_or_restore_prescriptions(): void
    {
        $kasir = $this->userWithRole('kasir');
        $p = $this->prescription();

        $this->actingAs($kasir)->delete(route('prescriptions.destroy', $p->id))->assertForbidden();
        $this->actingAs($kasir)->post(route('prescriptions.bulk-destroy'), ['ids' => [$p->id]])->assertForbidden();
        $this->assertNull($p->fresh()->deleted_at);

        $p->delete();
        $this->actingAs($kasir)->post(route('prescriptions.restore', $p->id))->assertForbidden();
        $this->actingAs($kasir)->delete(route('prescriptions.force-delete', $p->id))->assertForbidden();
        $this->assertSoftDeleted('prescriptions', ['id' => $p->id]);
    }

    public function test_dispensed_prescription_cannot_be_trashed(): void
    {
        $p = $this->prescription('DISPENSED');

        $this->actingAs($this->user)->delete(route('prescriptions.destroy', $p->id))->assertSessionHasErrors('message');
        $this->actingAs($this->user)->post(route('prescriptions.bulk-destroy'), ['ids' => [$p->id]]);

        $this->assertNull($p->fresh()->deleted_at);
    }

    public function test_force_delete_removes_prescription_attachment_file(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        \Illuminate\Support\Facades\Storage::disk('public')->put('prescriptions/x.jpg', 'img');
        $p = $this->prescription('DRAFT', 'prescriptions/x.jpg');
        $p->delete();

        $this->actingAs($this->user)->delete(route('prescriptions.force-delete', $p->id))->assertSessionHasNoErrors();

        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing('prescriptions/x.jpg');
    }

    public function test_supplier_code_of_trashed_supplier_is_rejected_by_validation(): void
    {
        $type = \App\Models\SupplierType::create(['name' => 'PBF', 'prefix_code' => 'PBF']);
        $old = \App\Models\Supplier::create(['supplier_type_id' => $type->id, 'code' => 'SPL-001', 'name' => 'Lama', 'is_active' => true]);
        $old->delete();

        $this->actingAs($this->user)->post(route('suppliers.store'), [
            'supplier_type_id' => $type->id, 'code' => 'SPL-001', 'name' => 'Baru',
        ])->assertSessionHasErrors('code');

        // quick-store: kode huruf kecil harus dibandingkan sebagai huruf besar
        $this->actingAs($this->user)->postJson(route('api.suppliers.quick-store'), [
            'supplier_type_id' => $type->id, 'code' => 'spl-001', 'name' => 'Baru 2',
        ])->assertStatus(422);
    }
}
