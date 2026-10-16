<?php

namespace App\Http\Controllers;

use App\Models\LocationType;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferenceController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'tipe-lokasi');
        $data = [];

        if ($tab === 'tipe-lokasi') {
            $data['locationTypes'] = LocationType::latest()->get();
        }

        return Inertia::render('References/Index', [
            'currentTab' => $tab,
            'data' => $data
        ]);
    }

    public function storeLocationType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix_code' => 'required|string|max:10',
            'intended_for' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $type = LocationType::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan tipe lokasi baru: {$type->name} ({$type->prefix_code})");

        return back();
    }

    public function updateLocationType(Request $request, LocationType $locationType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix_code' => 'required|string|max:10',
            'intended_for' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $locationType->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui tipe lokasi: {$locationType->name}");

        return back();
    }

    public function destroyLocationType(LocationType $locationType)
    {
        $name = $locationType->name;
        $locationType->delete();
        
        AuditLog::record('referensi', 'DELETE', "Menghapus tipe lokasi: {$name}");
        return back();
    }
}