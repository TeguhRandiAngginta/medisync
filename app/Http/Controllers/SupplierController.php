<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\AuditLog;
use App\Models\SupplierType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $trashed = $request->boolean('trashed', false);

        if ($trashed) {
            $suppliers = Supplier::onlyTrashed()->with('supplierType')->latest('deleted_at')->get();
        } else {
            $suppliers = Supplier::with('supplierType')->latest()->get();
        }

        return Inertia::render('Suppliers/Index', [
            'suppliers'    => $suppliers,
            'trashed'      => $trashed,
            'trashedCount' => Supplier::onlyTrashed()->count(),
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
            'supplier_type_id' => 'required|exists:supplier_types,id',
            'code'             => [
                'required',
                'string',
                'max:50',
                // Case-insensitive unique: hanya cek yang belum di-trash (deleted_at IS NULL)
                \Illuminate\Validation\Rule::unique('suppliers', 'code')->whereNull('deleted_at'),
            ],
            'name'             => [
                'required',
                'string',
                'max:255',
                // Pastikan tidak ada supplier aktif dengan nama sama (case-insensitive via whereRaw ilike)
                function ($attribute, $value, $fail) {
                    $exists = \App\Models\Supplier::whereNull('deleted_at')
                        ->whereRaw('LOWER(name) = ?', [strtolower($value)])
                        ->exists();
                    if ($exists) {
                        $fail('Supplier dengan nama ini sudah terdaftar sebagai pemasok aktif.');
                    }
                },
            ],
            'contact_person'   => 'nullable|string|max:255',
            'phone'            => 'nullable|string|max:50',
            'email'            => 'nullable|email|max:255',
            'address'          => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);

        AuditLog::record('supplier', 'CREATE', "Menambahkan pemasok baru: {$supplier->name}");

        return redirect()->route('suppliers.index')->with('success', 'Data Pemasok berhasil ditambahkan!');
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplierEdit'  => $supplier,
            'supplierTypes' => SupplierType::all()
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'supplier_type_id' => 'required|exists:supplier_types,id',
            'code'             => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('suppliers', 'code')
                    ->ignore($supplier->id)
                    ->whereNull('deleted_at'),
            ],
            'name'             => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($supplier) {
                    $exists = \App\Models\Supplier::whereNull('deleted_at')
                        ->where('id', '!=', $supplier->id)
                        ->whereRaw('LOWER(name) = ?', [strtolower($value)])
                        ->exists();
                    if ($exists) {
                        $fail('Supplier dengan nama ini sudah terdaftar sebagai pemasok aktif.');
                    }
                },
            ],
            'contact_person'   => 'nullable|string|max:255',
            'phone'            => 'nullable|string|max:50',
            'email'            => 'nullable|email|max:255',
            'address'          => 'nullable|string',
            'is_active'        => 'boolean',
        ]);

        $supplier->update($validated);

        AuditLog::record('supplier', 'UPDATE', "Memperbarui data pemasok: {$supplier->name}");

        return redirect()->route('suppliers.index')->with('success', 'Data Pemasok berhasil diperbarui!');
    }

    public function destroy(Supplier $supplier)
    {
        // Soft delete SELALU diizinkan — tidak perlu cek relasi (FK tidak dilanggar)
        DB::beginTransaction();
        try {
            $supplierName = $supplier->name;
            $supplier->delete(); // soft delete

            AuditLog::record('supplier', 'DELETE', "Memindahkan pemasok '{$supplierName}' ke keranjang sampah.");
            DB::commit();

            return redirect()->route('suppliers.index')->with('success', "Data Pemasok {$supplierName} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $supplier = Supplier::onlyTrashed()->findOrFail($id);

            // Validasi unique sebelum restore: cek apakah ada supplier aktif dengan nama/kode yang sama
            $nameConflict = Supplier::whereNull('deleted_at')
                ->whereRaw('LOWER(name) = ?', [strtolower($supplier->name)])
                ->exists();
            $codeConflict = Supplier::whereNull('deleted_at')
                ->whereRaw('LOWER(code) = ?', [strtolower($supplier->code)])
                ->exists();

            if ($nameConflict || $codeConflict) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Tidak dapat memulihkan: Sudah ada pemasok aktif dengan nama atau kode '{$supplier->code}' yang sama. Harap ubah nama/kode terlebih dahulu sebelum memulihkan."
                ]);
            }

            $supplier->restore();

            AuditLog::record('supplier', 'RESTORE', "Memulihkan data pemasok: {$supplier->name}");
            DB::commit();

            return redirect()->route('suppliers.index', ['trashed' => true])
                ->with('success', "Pemasok {$supplier->name} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $supplier = Supplier::onlyTrashed()->findOrFail($id);

            // Cegah force delete jika masih terhubung dengan data aktif maupun soft-deleted
            $purchaseCount = \App\Models\Purchase::withTrashed()->where('supplier_id', $supplier->id)->count();
            $medicineCount = \App\Models\Medicine::withTrashed()->where('supplier_id', $supplier->id)->count();

            if ($purchaseCount > 0 || $medicineCount > 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Tidak dapat dihapus permanen: Pemasok '{$supplier->name}' masih terhubung dengan {$purchaseCount} Faktur Pembelian dan {$medicineCount} data obat."
                ]);
            }

            $supplierName = $supplier->name;
            $supplier->forceDelete();

            AuditLog::record('supplier', 'FORCE DELETE', "Menghapus PERMANEN data pemasok: {$supplierName}");
            DB::commit();

            return redirect()->route('suppliers.index', ['trashed' => true])
                ->with('success', "Data pemasok {$supplierName} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:suppliers,id',
        ]);

        // Soft delete SELALU diizinkan — langsung pindah ke trash tanpa cek relasi
        DB::beginTransaction();
        try {
            $suppliers = Supplier::whereIn('id', $validated['ids'])->get();
            foreach ($suppliers as $supplier) {
                $supplier->delete();
            }
            AuditLog::record('supplier', 'BULK_DELETE', 'Memindahkan ' . count($suppliers) . ' pemasok ke keranjang sampah.');
            DB::commit();

            return redirect()->route('suppliers.index')->with('success', count($suppliers) . ' pemasok berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $suppliers = Supplier::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($suppliers as $supplier) {
                $supplier->restore();
            }
            AuditLog::record('supplier', 'BULK_RESTORE', 'Memulihkan ' . count($suppliers) . ' pemasok dari keranjang sampah.');
            DB::commit();

            return redirect()->route('suppliers.index', ['trashed' => true])
                ->with('success', count($suppliers) . ' pemasok berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal pulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'supplier_type_id' => 'required|exists:supplier_types,id',
            'code'             => 'required|string|max:50|unique:suppliers,code',
            'name'             => 'required|string|max:255',
            'contact_person'   => 'nullable|string|max:255',
            'phone'            => 'nullable|string|max:50',
            'email'            => 'nullable|email|max:255',
            'address'          => 'nullable|string',
        ]);

        $validated['code']      = strtoupper($validated['code']);
        $validated['is_active'] = true;

        $supplier = Supplier::create($validated);

        AuditLog::record('supplier', 'CREATE', "Menambahkan pemasok baru (Quick Add via Faktur): {$supplier->name}");

        return response()->json([
            'message'  => "Supplier {$supplier->name} ({$supplier->code}) berhasil ditambahkan!",
            'supplier' => $supplier
        ]);
    }
}
