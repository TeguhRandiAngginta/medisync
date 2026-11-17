<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Pencocokan obat hasil OCR memakai operator `ilike` (khusus PostgreSQL),
 * jadi test ini dilewati bila DB test bukan pgsql.
 */
class PrescriptionOcrMatchingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected MedicineCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Butuh PostgreSQL (operator ilike).');
        }

        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
        $this->category = MedicineCategory::create(['name' => 'Obat', 'is_active' => true]);
        config(['services.google_ai.api_key' => 'test-key']);
    }

    private function med(string $name, ?string $strength = null): Medicine
    {
        return Medicine::create([
            'medicine_category_id' => $this->category->id, 'name' => $name,
            'sku' => 'SKU-' . strtoupper(uniqid()), 'base_unit' => 'Tablet', 'dosage_strength' => $strength,
            'selling_price' => 1000, 'min_stock' => 1, 'is_active' => true,
        ]);
    }

    private function analyze(array $items): \Illuminate\Testing\TestResponse
    {
        Http::fake([
            '*' => Http::response(['candidates' => [['content' => ['parts' => [[
                'text' => json_encode(['patient_name' => 'A', 'doctor_name' => 'B', 'items' => $items]),
            ]]]]]]),
        ]);

        return $this->actingAs($this->user)->postJson(route('api.prescriptions.analyze'), [
            'attachment' => UploadedFile::fake()->image('resep.jpg'),
        ]);
    }

    public function test_strength_in_prescription_selects_matching_strength_only(): void
    {
        $this->med('Amoxicillin 250mg');
        $m500 = $this->med('Amoxicillin 500mg');

        $res = $this->analyze([['medicine_name' => 'Amoxicillin 500', 'quantity' => 10, 'signa' => '3x1']])->assertOk();

        $this->assertCount(1, $res->json('items'));
        $this->assertSame($m500->id, $res->json('items.0.medicine_id'));
    }

    public function test_strength_written_with_space_and_unit_still_matches(): void
    {
        $this->med('Amoxicillin 250mg');
        $m500 = $this->med('Amoxicillin 500mg');

        $res = $this->analyze([['medicine_name' => 'Amoxicillin 500 mg', 'quantity' => 10, 'signa' => '3x1']])->assertOk();

        $this->assertSame($m500->id, $res->json('items.0.medicine_id'));
    }

    public function test_wrong_strength_is_not_silently_replaced(): void
    {
        $this->med('Amoxicillin 250mg');
        $this->med('Amoxicillin 500mg');

        $res = $this->analyze([['medicine_name' => 'Amoxicillin 1000', 'quantity' => 5, 'signa' => '2x1']])->assertOk();

        $this->assertCount(0, $res->json('items'));
        $this->assertStringContainsString('Kekuatan/dosis', $res->json('notes'));
    }

    public function test_ambiguous_name_requires_manual_choice(): void
    {
        $this->med('Paracetamol 500mg');
        $this->med('Paracetamol 650mg');

        $res = $this->analyze([['medicine_name' => 'Paracetamol', 'quantity' => 10, 'signa' => '3x1']])->assertOk();

        $this->assertCount(0, $res->json('items'));
        $this->assertStringContainsString('pilih manual', $res->json('notes'));
        $this->assertStringContainsString('Paracetamol 500mg', $res->json('notes'));
        $this->assertStringContainsString('Paracetamol 650mg', $res->json('notes'));
    }

    public function test_exact_name_wins_over_longer_names(): void
    {
        $exact = $this->med('Vitamin C');
        $this->med('Vitamin C 1000mg');

        $res = $this->analyze([['medicine_name' => 'vitamin c', 'quantity' => 1, 'signa' => '1x1']])->assertOk();

        $this->assertSame($exact->id, $res->json('items.0.medicine_id'));
    }

    public function test_like_wildcards_from_ocr_do_not_match_everything(): void
    {
        $this->med('Paracetamol 500mg');
        $this->med('Ibuprofen 400mg');

        $res = $this->analyze([['medicine_name' => '%%%', 'quantity' => 1, 'signa' => '1x1']])->assertOk();

        $this->assertCount(0, $res->json('items'));
    }

    public function test_invalid_upload_returns_422_not_500(): void
    {
        $this->actingAs($this->user)->postJson(route('api.prescriptions.analyze'), [])->assertStatus(422);
    }
}
