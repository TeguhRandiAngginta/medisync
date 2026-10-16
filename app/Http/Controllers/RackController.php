<?php

namespace App\Http\Controllers;

use App\Models\Rack;
use App\Models\LocationType;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RackController extends Controller
{
    public function index()
    {
        $racks = Rack::with('locationType')->latest()->get();
        return Inertia::render('Racks/Index', [
            'racks' => $racks
        ]);
    }

    public function create()
    {
        return Inertia::render('Racks/Create', [
            'locationTypes' => LocationType::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_type_id' => 'required|exists:location_types,id',
            'code' => 'required|string|max:50|unique:racks',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $rack = Rack::create([
            'branch_id' => $request->user()->branch_id ?? 1,
            'location_type_id' => $validated['location_type_id'],
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        AuditLog::record('rak', 'CREATE', "Menambahkan lokasi rak baru: {$rack->name} ({$rack->code})");

        return redirect()->route('racks.index');
    }

    public function edit(Rack $rack)
    {
        return Inertia::render('Racks/Edit', [
            'rackEdit' => $rack,
            'locationTypes' => LocationType::all()
        ]);
    }

    public function update(Request $request, Rack $rack)
    {
        $validated = $request->validate([
            'location_type_id' => 'required|exists:location_types,id',
            'code' => 'required|string|max:50|unique:racks,code,' . $rack->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $rack->update([
            'branch_id' => $request->user()->branch_id ?? $rack->branch_id ?? 1,
            'location_type_id' => $validated['location_type_id'],
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $request->is_active ?? false,
        ]);

        AuditLog::record('rak', 'UPDATE', "Memperbarui data lokasi rak: {$rack->name}");

        return redirect()->route('racks.index');
    }

    public function destroy(Rack $rack)
    {
        $rackName = $rack->name;
        $rack->delete();

        AuditLog::record('rak', 'DELETE', "Menghapus lokasi rak: {$rackName}");

        return redirect()->route('racks.index');
    }
}