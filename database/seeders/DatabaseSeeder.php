<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $branch = Branch::firstOrCreate(
            ['code' => 'APT-01'],
            [
                'name' => 'Apotek Pusat MediSync',
                'address' => 'Jl. Kesehatan No. 1',
                'phone' => '08123456789',
                'is_active' => true,
            ]
        );

        $roles = [
            ['name' => 'Pemilik (Superadmin)', 'slug' => 'superadmin', 'description' => 'Akses penuh ke seluruh sistem'],
            ['name' => 'Apoteker', 'slug' => 'apoteker', 'description' => 'Akses operasional dan inventaris'],
            ['name' => 'Kasir', 'slug' => 'kasir', 'description' => 'Akses transaksi POS dan Shift'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(['slug' => $roleData['slug']], $roleData);
        }

        $superadminRole = Role::where('slug', 'superadmin')->first();

        User::firstOrCreate(
            ['email' => 'admin@medisync.com'],
            [
                'name' => 'Randi Superadmin',
                'password' => Hash::make('password'),
                'branch_id' => $branch->id,
                'role_id' => $superadminRole->id,
                'phone' => '081111222233',
                'is_active' => true,
            ]
        );

        $this->call([
        MasterDataSeeder::class,
    ]);
    }
}