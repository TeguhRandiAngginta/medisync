<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_registration_screen(): void
    {
        $response = $this->get('/register');

        $response->assertRedirect('/login');
    }

    public function test_superadmin_can_render_registration_screen(): void
    {
        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin']);
        $admin = User::factory()->create(['role_id' => $role->id]);

        $response = $this->actingAs($admin)->get('/register');

        $response->assertStatus(200);
    }

    public function test_superadmin_can_register_new_users(): void
    {
        $role = Role::create(['name' => 'Superadmin', 'slug' => 'superadmin']);
        $kasirRole = Role::create(['name' => 'Kasir', 'slug' => 'kasir']);
        $admin = User::factory()->create(['role_id' => $role->id]);

        $response = $this->actingAs($admin)->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'role_id' => $kasirRole->id]);
        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
