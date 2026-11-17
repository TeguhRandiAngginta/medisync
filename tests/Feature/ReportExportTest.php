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
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected MedicineCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        $this->actingAs($this->user);
    }

    private function med(string $name, int $stock, int $min, bool $active = true): Medicine
    {
        return Medicine::create([
            'medicine_category_id' => $this->category->id, 'name' => $name, 'sku' => 'SKU-' . strtoupper(uniqid()),
            'base_unit' => 'Tablet', 'selling_price' => 10000, 'stock' => $stock, 'min_stock' => $min, 'is_active' => $active,
        ]);
    }

    private function export(string $type, string $format = 'pdf'): string
    {
        return $this->get(route('reports.export', [
            'type' => $type, 'format' => $format,
            'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->toDateString(),
        ]))->assertOk()->getContent();
    }

    public function test_stock_export_uses_real_stock_and_per_medicine_minimum(): void
    {
        $low = $this->med('ObatKritis', 3, 5);
        $this->med('ObatAman', 50, 5);
        $this->med('ObatNonaktif', 0, 5, false);
        DB::table('medicines')->where('id', $low->id)->update(['current_stock' => 999]); // kolom legacy usang

        $html = $this->export('stock');

        $this->assertStringContainsString('ObatKritis', $html);
        $this->assertStringContainsString('3 Tablet', $html);
        $this->assertStringNotContainsString('999', $html);
        $this->assertStringNotContainsString('ObatAman', $html);
        $this->assertStringNotContainsString('ObatNonaktif', $html);

        // Template Excel memakai data yang sama
        $excel = view('reports.print', [
            'type' => 'stock', 'title' => 'Stok', 'startDate' => 'a', 'endDate' => 'b', 'isExcel' => true,
            'data' => Medicine::with('category')->lowStock()->get(),
        ])->render();
        $this->assertStringContainsString('ObatKritis', $excel);
        $this->assertStringNotContainsString('999', $excel);
    }

    public function test_report_summary_low_stock_matches_export(): void
    {
        $this->med('A', 1, 5);
        $this->med('B', 5, 5);
        $this->med('C', 6, 5);

        $page = $this->get(route('reports.index'))->assertOk()->viewData('page');

        $this->assertSame(2, $page['props']['summary']['low_stock']);
    }

    public function test_profit_export_uses_real_hpp_and_matches_report_screen(): void
    {
        $medicine = $this->med('ObatLaba', 10, 1);
        $sale = Sale::create([
            'invoice_number' => 'INV-LABA', 'user_id' => $this->user->id, 'total_amount' => 20000,
            'subtotal_amount' => 20000, 'paid_amount' => 20000, 'change_amount' => 0,
            'payment_method' => 'Cash', 'sale_date' => now(),
        ]);
        SaleDetail::create([
            'sale_id' => $sale->id, 'medicine_id' => $medicine->id, 'batch_number' => 'B1',
            'quantity' => 2, 'selling_price' => 10000, 'subtotal' => 20000, 'purchase_price' => 4000,
        ]);
        $medicine->delete(); // obat di-trash tidak boleh membuat export error

        $html = $this->export('profit');

        $this->assertStringContainsString('Rp 8.000', $html);    // HPP riil: 2 x 4.000
        $this->assertStringContainsString('Rp 12.000', $html);   // laba: 20.000 - 8.000
        $this->assertStringNotContainsString('Rp 14.000', $html); // HPP lama: 70% harga jual

        $summary = $this->get(route('reports.index', [
            'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->toDateString(),
        ]))->viewData('page')['props']['summary'];

        $this->assertEquals(8000, $summary['total_hpp']);
        $this->assertEquals(12000, $summary['profit']);
    }
}
