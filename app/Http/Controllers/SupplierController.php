<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\AuditLog;
use App\Models\SupplierType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::with('supplierType')->latest()->get();
        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers
        ]);
    }

    public function create()
    {
        return Inertia::render('Suppliers/Create', [
            'supplierTypes' => SupplierType::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_type_id' => 'required|exists:supplier_types,id', // Validasi Field Baru
            'code' => 'required|unique:suppliers,code',
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);

        AuditLog::record('supplier', 'CREATE', "Menambahkan pemasok baru: {$supplier->name}");

        return redirect()->route('suppliers.index')->with('success', 'Data Pemasok berhasil ditambahkan!');
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplierEdit' => $supplier,
            'supplierTypes' => SupplierType::all()
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'supplier_type_id' => 'required|exists:supplier_types,id', // Validasi Field Baru
            'code' => 'required|string|max:50|unique:suppliers,code,' . $supplier->id,
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        AuditLog::record('supplier', 'UPDATE', "Memperbarui data pemasok: {$supplier->name}");

        return redirect()->route('suppliers.index')->with('success', 'Data Pemasok berhasil diperbarui!');
    }

    public function destroy(Supplier $supplier)
    {
        $supplierName = $supplier->name;
        $supplier->delete();

        AuditLog::record('supplier', 'DELETE', "Menghapus data pemasok: {$supplierName}");
        return redirect()->route('suppliers.index')->with('success', "Data Pemasok {$supplierName} berhasil dihapus permanen.");
    }
}