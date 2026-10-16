<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::latest()->get();
        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers
        ]);
    }

    public function create()
    {
        return Inertia::render('Suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|unique:suppliers,code',
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);

        \App\Models\AuditLog::record('supplier', 'CREATE', "Menambahkan pemasok baru: {$supplier->name}");

        return redirect()->route('suppliers.index');
    }

    public function edit(\App\Models\Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplierEdit' => $supplier
        ]);
    }

    public function update(Request $request, \App\Models\Supplier $supplier)
    {
        $validated = $request->validate([
            // Pengecualian validasi unique untuk ID supplier yang sedang diedit
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

        return redirect()->route('suppliers.index');
    }

    public function destroy(\App\Models\Supplier $supplier)
    {
        $supplierName = $supplier->name;
        $supplier->delete();

        AuditLog::record('supplier', 'DELETE', "Menghapus data pemasok: {$supplierName}");

        return redirect()->route('suppliers.index');
    }
}