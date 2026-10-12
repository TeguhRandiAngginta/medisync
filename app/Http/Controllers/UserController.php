<?php

namespace App\Http\Controllers;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['role', 'branch'])->latest()->get();
        return Inertia::render('Users/Index', ['users' => $users]);
    }

    public function create()
    {
        $roles = Role::all();
        $branches = Branch::where('is_active', true)->get();
        
        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'branches' => $branches
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'branch_id' => $validated['branch_id'],
            'is_active' => true,
        ]);

        $user->markEmailAsVerified();

        AuditLog::record('akun', 'CREATE', "Membuat akun baru bernama: {$user->name}");

        return redirect()->route('users.index');
    }

    public function edit(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('users.index');
        }

        $roles = Role::all();
        $branches = Branch::where('is_active', true)->get();
        
        return Inertia::render('Users/Edit', [
            'userEdit' => $user->load(['role', 'branch']),
            'roles' => $roles,
            'branches' => $branches
        ]);
    }

    public function update(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            abort(403, 'Tidak diizinkan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        $user->fill($validated);

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:8|confirmed']);
            $user->password = Hash::make($request->password);
        }

        $user->save();

        AuditLog::record('akun', 'UPDATE', "Memperbarui data akun milik: {$user->name}");

        return redirect()->route('users.index');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            abort(403, 'Anda tidak bisa menghapus akun Anda sendiri.');
        }

        $userName = $user->name;
        
        $user->delete();

        \App\Models\AuditLog::record('akun', 'DELETE', "Menghapus akun karyawan secara permanen: {$userName}");

        return redirect()->route('users.index');
    }
}