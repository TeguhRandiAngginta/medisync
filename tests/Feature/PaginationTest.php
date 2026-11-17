<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Supplier;
use App\Models\SupplierType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Halaman berdaftar panjang dipaginasi di server (25 per halaman) tanpa merusak ringkasan/export.
 */
class PaginationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected MedicineCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->admin = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->actingAs($this->admin);
    }

    private function medicine(string $name): Medicine
    {
        return Medicine::create([
            'medicine_category_id' => $this->category->id, 'name' => $name, 'sku' => 'SKU-' . strtoupper(uniqid()),
            'base_unit' => 'Tablet', 'selling_price' => 10000, 'min_stock' => 1, 'is_active' => true,
        ]);
    }

    private function props(string $url): array
    {
        return $this->get($url)->assertOk()->viewData('page')['props'];
    }

    public function test_audit_logs_are_paginated_per_tab(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            AuditLog::create(['user_id' => $this->admin->id, 'module' => 'akun', 'action' => 'UPDATE', 'description' => "log {$i}", 'ip_address' => '127.0.0.1']);
        }
        AuditLog::create(['user_id' => $this->admin->id, 'module' => 'stok', 'action' => 'UPDATE', 'description' => 'lain', 'ip_address' => '127.0.0.1']);

        $page1 = $this->props('/audit-logs?tab=akun')['logs'];
        $page2 = $this->props('/audit-logs?tab=akun&page=2')['logs'];

        $this->assertSame(30, $page1['total']);
        $this->assertCount(25, $page1['data']);
        $this->assertCount(5, $page2['data']);
        $this->assertSame('log 30', $page1['data'][0]['description'], 'Terbaru tampil lebih dulu.');
        $this->assertStringContainsString('tab=akun', $page1['links'][2]['url'], 'Parameter tab harus ikut di tautan halaman.');
    }

    public function test_products_are_paginated_and_keep_trashed_filter_in_links(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $this->medicine("Obat {$i}");
        }
        $this->medicine('Obat Terhapus')->delete();

        $active = $this->props('/products')['products'];
        $this->assertSame(30, $active['total']);
        $this->assertCount(25, $active['data']);

        $trashed = $this->props('/products?trashed=1')['products'];
        $this->assertSame(1, $trashed['total']);
    }

    public function test_report_summary_covers_whole_period_but_list_is_paginated(): void
    {
        $medicine = $this->medicine('ObatLaporan');
        for ($i = 1; $i <= 30; $i++) {
            $sale = Sale::create([
                'invoice_number' => sprintf('INV-%03d', $i), 'user_id' => $this->admin->id, 'total_amount' => 10000,
                'subtotal_amount' => 10000, 'paid_amount' => 10000, 'change_amount' => 0, 'payment_method' => 'Cash',
                'sale_date' => now()->subMinutes(31 - $i),
            ]);
            SaleDetail::create([
                'sale_id' => $sale->id, 'medicine_id' => $medicine->id, 'batch_number' => 'B1', 'quantity' => 1,
                'selling_price' => 10000, 'subtotal' => 10000, 'purchase_price' => 4000,
            ]);
        }

        $props = $this->props('/reports?start_date=' . now()->toDateString() . '&end_date=' . now()->toDateString());

        $this->assertSame(30, $props['salesList']['total']);
        $this->assertCount(25, $props['salesList']['data']);
        $this->assertSame(30, $props['summary']['total_transactions']);
        $this->assertEquals(300000, $props['summary']['total_sales']);
        $this->assertEquals(120000, $props['summary']['total_hpp']);
        $this->assertEquals(180000, $props['summary']['profit']);
    }

    public function test_stock_ledger_is_paginated_but_export_contains_everything(): void
    {
        $medicine = $this->medicine('ObatKartu');
        $type = SupplierType::create(['name' => 'PBF', 'prefix_code' => 'PBF']);
        $supplier = Supplier::create(['supplier_type_id' => $type->id, 'code' => 'S1', 'name' => 'PBF', 'is_active' => true]);
        $purchase = Purchase::create([
            'internal_receipt_number' => 'BPB-1', 'invoice_number' => 'FAKTUR-1', 'supplier_id' => $supplier->id,
            'user_id' => $this->admin->id, 'purchase_date' => now()->toDateString(), 'total_amount' => 100, 'status' => 'completed',
        ]);
        PurchaseDetail::create([
            'purchase_id' => $purchase->id, 'medicine_id' => $medicine->id, 'batch_number' => 'B1',
            'expired_date' => now()->addYear()->toDateString(), 'quantity' => 100, 'purchase_price' => 1, 'subtotal' => 100,
        ]);
        for ($i = 1; $i <= 30; $i++) {
            $sale = Sale::create([
                'invoice_number' => sprintf('INV-%03d', $i), 'user_id' => $this->admin->id, 'total_amount' => 1, 'subtotal_amount' => 1,
                'paid_amount' => 1, 'change_amount' => 0, 'payment_method' => 'Cash', 'sale_date' => now()->addMinutes($i),
            ]);
            SaleDetail::create(['sale_id' => $sale->id, 'medicine_id' => $medicine->id, 'batch_number' => 'B1', 'quantity' => 1, 'selling_price' => 1, 'subtotal' => 1, 'purchase_price' => 1]);
        }

        $range = 'start_date=' . now()->toDateString() . '&end_date=' . now()->addDay()->toDateString();
        $page1 = $this->props("/reports?{$range}")['stockMutations'];
        $page2 = $this->props("/reports?{$range}&ledger_page=2")['stockMutations'];

        $this->assertSame(31, $page1['total']);
        $this->assertCount(25, $page1['data']);
        $this->assertCount(6, $page2['data']);
        $this->assertSame(70, $page1['data'][0]['balance'], 'Saldo terbaru = 100 - 30.');
        $this->assertSame(100, $page2['data'][5]['balance'], 'Baris tertua (pembelian) ada di halaman terakhir.');

        $html = $this->get("/reports/export?type=mutations&format=pdf&{$range}")->assertOk()->getContent();
        $this->assertStringContainsString('FAKTUR-1', $html);   // baris tertua, di luar halaman 1
        $this->assertStringContainsString('INV-030', $html);
    }

    private function supplier(): Supplier
    {
        $type = SupplierType::firstOrCreate(['name' => 'PBF'], ['prefix_code' => 'PBF']);

        return Supplier::firstOrCreate(['code' => 'S-PAG'], ['supplier_type_id' => $type->id, 'name' => 'PBF Paginasi', 'is_active' => true]);
    }

    public function test_prescriptions_are_paginated_with_separate_trash_listing(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            \App\Models\Prescription::create([
                'prescription_number' => sprintf('RSP-%03d', $i), 'patient_name' => 'P', 'doctor_name' => 'D',
                'prescription_date' => now()->toDateString(), 'status' => 'DRAFT', 'user_id' => $this->admin->id,
            ]);
        }
        \App\Models\Prescription::where('prescription_number', 'RSP-001')->first()->delete();

        $page1 = $this->props('/prescriptions')['prescriptions'];
        $page2 = $this->props('/prescriptions?page=2')['prescriptions'];
        $trashed = $this->props('/prescriptions?trashed=1')['prescriptions'];

        $this->assertSame(29, $page1['total']);
        $this->assertCount(25, $page1['data']);
        $this->assertCount(4, $page2['data']);
        $this->assertSame(1, $trashed['total']);
    }

    public function test_purchases_and_purchase_trash_are_paginated(): void
    {
        $supplier = $this->supplier();
        for ($i = 1; $i <= 30; $i++) {
            Purchase::create([
                'internal_receipt_number' => "BPB-{$i}", 'invoice_number' => "FAKTUR-{$i}", 'supplier_id' => $supplier->id,
                'user_id' => $this->admin->id, 'purchase_date' => now()->toDateString(), 'total_amount' => 100, 'status' => 'completed',
            ]);
        }
        foreach (range(1, 27) as $i) {
            Purchase::where('invoice_number', "FAKTUR-{$i}")->first()->delete(); // 27 ke trash, 3 aktif
        }

        $active = $this->props('/purchases')['purchases'];
        $this->assertSame(3, $active['total']);
        $this->assertCount(3, $active['data']);

        $trashedPage1 = $this->props('/purchases?trashed=1')['purchases'];
        $this->assertSame(27, $trashedPage1['total']);
        $this->assertCount(25, $trashedPage1['data']);

        $trashRoute1 = $this->props('/purchases/trash')['purchases'];
        $trashRoute2 = $this->props('/purchases/trash?page=2')['purchases'];
        $this->assertSame(27, $trashRoute1['total']);
        $this->assertCount(25, $trashRoute1['data']);
        $this->assertCount(2, $trashRoute2['data']);
    }
}
