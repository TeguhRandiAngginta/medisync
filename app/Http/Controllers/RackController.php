<?php

namespace App\Http\Controllers;

use App\Models\Rack;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class RackController extends Controller
{
    public function index()
    {
        // Hanya mengambil rak yang berada di cabang yang sama dengan pengguna
        $userBranchId = Auth::user()->branch_id;
        $racks = Rack::where('branch_id', $userBranchId)->latest()->get();

        return Inertia::render('Racks/Index', [
            'racks' => $racks
        ]);
    }

    public function create()
    {
        return Inertia::render('Racks/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:racks,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Otomatis menetapkan branch_id berdasarkan user yang sedang login
        $validated['branch_id'] = Auth::user()->branch_id;
        $validated['is_active'] = true;

        Rack::create($validated);

        return redirect()->route('racks.index');
    }
}