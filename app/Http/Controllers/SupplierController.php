<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\AuditLog;
use App\Models\SupplierType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Support\ReferenceUsage;

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
                // Kolom `code` unik di level DB (termasuk yang di trash), jadi validasi harus sama.
                \Illuminate\Validation\Rule::unique('suppliers', 'code'),
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
                    ->ignore($supplier->id),
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
        if ($usage = ReferenceUsage::blocker('supplier', $supplier->id)) {
            return back()->withErrors(['message' => ReferenceUsage::message('Pemasok', $supplier->name, $usage)]);
        }

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

            $reasons = [];
            if ($purchaseCount > 0) {
                $reasons[] = "Faktur Pembelian ({$purchaseCount} transaksi pada purchases)";
            }
            if ($medicineCount > 0) {
                $reasons[] = "Katalog Obat ({$medicineCount} produk pada medicines)";
            }

            if (!empty($reasons)) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Aksi Ditolak: Pemasok '{$supplier->name}' ({$supplier->code}) tidak dapat dihapus secara permanen karena masih terhubung dengan: " . implode(' dan ', $reasons) . " (termasuk data di dalam Trash)."
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

        // Yang masih dipakai data aktif dilewati (lihat ReferenceUsage); sisanya dipindahkan ke trash.
        DB::beginTransaction();
        try {
            $suppliers = Supplier::whereIn('id', $validated['ids'])->get();
            $deleted = 0;
            $failed = [];
            foreach ($suppliers as $supplier) {
                if ($usage = ReferenceUsage::blocker('supplier', $supplier->id)) {
                    $failed[] = "{$supplier->name} ({$usage})";
                    continue;
                }
                $supplier->delete();
                $deleted++;
            }

            if ($deleted === 0 && count($failed) > 0) {
                DB::rollBack();
                return back()->withErrors(['message' => 'Seluruh pemasok terpilih masih dipakai dan tidak dapat dihapus: ' . implode('; ', $failed) . '. Pindahkan atau hapus data yang memakainya terlebih dahulu.']);
            }

            $skipNote = count($failed) > 0 ? ' Dilewati karena masih dipakai: ' . implode('; ', $failed) . '.' : '';
            AuditLog::record('supplier', 'BULK_DELETE', 'Memindahkan ' . $deleted . ' pemasok ke keranjang sampah.');
            DB::commit();

            return redirect()->route('suppliers.index')->with('success', $deleted . ' pemasok berhasil dipindahkan ke tong sampah.' . $skipNote);
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

    public function bulkForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $suppliers = Supplier::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNames = [];

            foreach ($suppliers as $supplier) {
                $purchaseCount = \App\Models\Purchase::withTrashed()->where('supplier_id', $supplier->id)->count();
                $medicineCount = \App\Models\Medicine::withTrashed()->where('supplier_id', $supplier->id)->count();

                $reasons = [];
                if ($purchaseCount > 0) $reasons[] = "Pembelian ({$purchaseCount})";
                if ($medicineCount > 0) $reasons[] = "Obat ({$medicineCount})";

                if (!empty($reasons)) {
                    $failedNames[] = "{$supplier->name} [" . implode(', ', $reasons) . "]";
                    continue;
                }

                $name = $supplier->name;
                $supplier->forceDelete();
                AuditLog::record('supplier', 'FORCE DELETE', "Menghapus PERMANEN data pemasok: {$name} (bulk)");
                $deletedCount++;
            }

            if (count($failedNames) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh pemasok terpilih tidak dapat dihapus permanen karena masih terhubung dengan Faktur Pembelian atau katalog obat: ' . implode('; ', $failedNames) . ' (termasuk data di dalam Trash).'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} pemasok berhasil dihapus secara permanen.";
            if (count($failedNames) > 0) {
                $message .= ' Namun ' . count($failedNames) . ' pemasok dilewati karena masih terikat data pembelian atau obat: ' . implode('; ', $failedNames) . '.';
            }

            return redirect()->route('suppliers.index', ['trashed' => true])->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }

    public function quickStore(Request $request)
    {
        if ($request->filled('code')) {
            $request->merge(['code' => strtoupper($request->code)]);
        }

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
