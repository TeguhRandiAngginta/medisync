<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LocationType;
use App\Models\SupplierType;
use App\Models\MedicineCategory;
use App\Models\AuditLog;
use App\Models\Supplier;

class ReferenceController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'tipe-lokasi');
        $data = [];

        if ($tab === 'tipe-lokasi') {
            $data['locationTypes'] = LocationType::latest()->get();
        } elseif ($tab === 'tipe-supplier') {
            $data['supplierTypes'] = SupplierType::latest()->get();
        } elseif ($tab === 'golongan-obat') {
            $data['medicineCategories'] = MedicineCategory::latest()->get();
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
            'intended_for' => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $type = LocationType::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan tipe lokasi: {$type->name}");
        return back()->with('success', 'Tipe Lokasi berhasil ditambahkan!');
    }

    public function updateLocationType(Request $request, LocationType $locationType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix_code' => 'required|string|max:10',
            'intended_for' => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $locationType->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui tipe lokasi: {$locationType->name}");
        return back()->with('success', 'Tipe Lokasi berhasil diperbarui!');
    }

    public function destroyLocationType(LocationType $locationType)
    {
        $name = $locationType->name;
        $locationType->delete();
        AuditLog::record('referensi', 'DELETE', "Menghapus tipe lokasi: {$name}");
        return back()->with('success', "Tipe Lokasi {$name} berhasil dihapus.");
    }

    public function storeSupplierType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix_code' => 'required|string|max:10|unique:supplier_types,prefix_code',
            'description' => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $type = SupplierType::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan tipe supplier: {$type->name}");
        return back()->with('success', 'Tipe Supplier berhasil ditambahkan!');
    }

    public function updateSupplierType(Request $request, SupplierType $supplierType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix_code' => 'required|string|max:10|unique:supplier_types,prefix_code,' . $supplierType->id,
            'description' => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);
        
        $supplierType->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui tipe supplier: {$supplierType->name}");
        return back()->with('success', 'Tipe Supplier berhasil diperbarui!');
    }

    public function destroySupplierType(SupplierType $supplierType)
    {
        $usedCount = Supplier::where('supplier_type_id', $supplierType->id)->count();
        if ($usedCount > 0) {
            return back()->withErrors(['message' => "Tipe ini tidak bisa dihapus karena sedang digunakan oleh {$usedCount} pemasok."]);
        }

        $name = $supplierType->name;
        $supplierType->delete();
        AuditLog::record('referensi', 'DELETE', "Menghapus tipe supplier: {$name}");
        return back()->with('success', "Tipe Supplier {$name} berhasil dihapus.");
    }

    public function storeMedicineCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:medicine_categories,name',
            'description' => 'nullable|string',
        ]);
        
        $category = MedicineCategory::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan golongan obat: {$category->name}");
        return back()->with('success', 'Golongan obat berhasil ditambahkan!');
    }

    public function updateMedicineCategory(Request $request, MedicineCategory $medicineCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:medicine_categories,name,' . $medicineCategory->id,
            'description' => 'nullable|string',
        ]);
        
        $medicineCategory->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui golongan obat: {$medicineCategory->name}");
        return back()->with('success', 'Golongan obat berhasil diperbarui!');
    }

    public function destroyMedicineCategory(MedicineCategory $medicineCategory)
    {
        $name = $medicineCategory->name;
        $medicineCategory->delete();
        
        AuditLog::record('referensi', 'DELETE', "Menghapus golongan obat: {$name}");
        return back()->with('success', "Golongan obat {$name} berhasil dihapus.");
    }
}   