<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Lampiran resep = data medis pasien: tidak boleh dilayani tanpa login lewat /storage.
 */
class PrescriptionAttachmentSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::fake('public');

        $role = Role::create(['name' => 'Kasir', 'slug' => 'kasir', 'description' => 'x']);
        $branch = Branch::create(['code' => 'C1', 'name' => 'Cabang', 'address' => 'x', 'phone' => '1']);
        $this->user = User::factory()->create(['role_id' => $role->id, 'branch_id' => $branch->id, 'is_active' => true]);
    }

    private function prescription(?string $attachment): Prescription
    {
        return Prescription::create([
            'prescription_number' => 'RSP-' . uniqid(), 'patient_name' => 'A', 'doctor_name' => 'B',
            'prescription_date' => now()->toDateString(), 'status' => 'DRAFT', 'attachment' => $attachment, 'user_id' => $this->user->id,
        ]);
    }

    public function test_new_attachment_is_stored_on_private_disk_and_not_publicly_reachable(): void
    {
        $medicine = \App\Models\Medicine::create([
            'medicine_category_id' => \App\Models\MedicineCategory::create(['name' => 'Obat', 'is_active' => true])->id,
            'name' => 'Obat', 'sku' => 'SKU1', 'base_unit' => 'Tablet', 'selling_price' => 1000, 'min_stock' => 1, 'is_active' => true,
        ]);

        $this->actingAs($this->user)->post(route('prescriptions.store'), [
            'patient_name' => 'A', 'doctor_name' => 'B', 'prescription_date' => now()->toDateString(),
            'attachment' => UploadedFile::fake()->image('resep.jpg'),
            'items' => [['medicine_id' => $medicine->id, 'quantity' => 1, 'signa' => '1x1']],
        ])->assertSessionHasNoErrors();

        $path = Prescription::firstOrFail()->attachment;

        Storage::disk('local')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_attachment_requires_login(): void
    {
        Storage::disk('local')->put('prescriptions/a.jpg', 'secret');
        $p = $this->prescription('prescriptions/a.jpg');

        $this->get(route('prescriptions.attachment', $p->id))->assertRedirect(route('login'));
    }

    public function test_logged_in_user_can_view_attachment(): void
    {
        Storage::disk('local')->put('prescriptions/a.jpg', 'secret');
        $p = $this->prescription('prescriptions/a.jpg');

        $this->actingAs($this->user)->get(route('prescriptions.attachment', $p->id))
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_legacy_attachment_on_public_disk_is_still_served(): void
    {
        Storage::disk('public')->put('prescriptions/old.jpg', 'legacy');
        $p = $this->prescription('prescriptions/old.jpg');

        $this->actingAs($this->user)->get(route('prescriptions.attachment', $p->id))->assertOk();
    }

    public function test_missing_attachment_returns_404(): void
    {
        $this->actingAs($this->user)->get(route('prescriptions.attachment', $this->prescription(null)->id))->assertNotFound();
        $this->actingAs($this->user)->get(route('prescriptions.attachment', $this->prescription('prescriptions/gone.jpg')->id))->assertNotFound();
    }

    public function test_command_moves_legacy_public_files_to_private_disk(): void
    {
        Storage::disk('public')->put('prescriptions/old.jpg', 'legacy');
        $p = $this->prescription('prescriptions/old.jpg');

        $this->artisan('prescriptions:secure-attachments')->assertSuccessful();

        Storage::disk('public')->assertMissing('prescriptions/old.jpg');
        Storage::disk('local')->assertExists('prescriptions/old.jpg');
        $this->actingAs($this->user)->get(route('prescriptions.attachment', $p->id))->assertOk();
    }
}
