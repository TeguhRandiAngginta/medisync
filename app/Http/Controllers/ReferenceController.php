<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LocationType;
use App\Models\SupplierType;
use App\Models\MedicineCategory;
use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class ReferenceController extends Controller
{
    public function index(Request $request)
    {
        $tab    = $request->query('tab', 'tipe-lokasi');
        $trashed = $request->boolean('trashed', false);
        $data   = [];

        if ($tab === 'tipe-lokasi') {
            if ($trashed) {
                $data['locationTypes'] = LocationType::onlyTrashed()->latest('deleted_at')->get();
            } else {
                $data['locationTypes'] = LocationType::latest()->get();
            }
            $data['trashedCount'] = ['locationTypes' => LocationType::onlyTrashed()->count()];

        } elseif ($tab === 'tipe-supplier') {
            if ($trashed) {
                $data['supplierTypes'] = SupplierType::onlyTrashed()->latest('deleted_at')->get();
            } else {
                $data['supplierTypes'] = SupplierType::latest()->get();
            }
            $data['trashedCount'] = ['supplierTypes' => SupplierType::onlyTrashed()->count()];

        } elseif ($tab === 'golongan-obat') {
            if ($trashed) {
                $data['medicineCategories'] = MedicineCategory::onlyTrashed()->latest('deleted_at')->get();
            } else {
                $data['medicineCategories'] = MedicineCategory::latest()->get();
            }
            $data['trashedCount'] = ['medicineCategories' => MedicineCategory::onlyTrashed()->count()];
        }

        return Inertia::render('References/Index', [
            'currentTab' => $tab,
            'trashed'    => $trashed,
            'data'       => $data,
        ]);
    }

    // ─── LOCATION TYPE ───────────────────────────────────────────────────────

    public function storeLocationType(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'prefix_code'  => 'required|string|max:10',
            'intended_for' => 'nullable|string',
            'description'  => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);

        $type = LocationType::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan tipe lokasi: {$type->name}");
        return back()->with('success', 'Tipe Lokasi berhasil ditambahkan!');
    }

    public function updateLocationType(Request $request, LocationType $locationType)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'prefix_code'  => 'required|string|max:10',
            'intended_for' => 'nullable|string',
            'description'  => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);

        $locationType->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui tipe lokasi: {$locationType->name}");
        return back()->with('success', 'Tipe Lokasi berhasil diperbarui!');
    }

    public function destroyLocationType(LocationType $locationType)
    {
        // Soft delete SELALU diizinkan — tidak perlu cek relasi
        DB::beginTransaction();
        try {
            $name = $locationType->name;
            $locationType->delete(); // soft delete
            AuditLog::record('referensi', 'DELETE', "Memindahkan tipe lokasi '{$name}' ke keranjang sampah.");
            DB::commit();
            return back()->with('success', "Tipe Lokasi {$name} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    public function restoreLocationType($id)
    {
        DB::beginTransaction();
        try {
            $locationType = LocationType::onlyTrashed()->findOrFail($id);
            $locationType->restore();
            AuditLog::record('referensi', 'RESTORE', "Memulihkan tipe lokasi: {$locationType->name}");
            DB::commit();
            return back()->with('success', "Tipe Lokasi {$locationType->name} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan: ' . $e->getMessage()]);
        }
    }

    public function forceDeleteLocationType($id)
    {
        DB::beginTransaction();
        try {
            $locationType = LocationType::onlyTrashed()->findOrFail($id);

            // Cegah force delete jika masih ada rak (aktif maupun soft-deleted) yang menggunakan tipe ini
            $usedCount = \App\Models\Rack::withTrashed()->where('location_type_id', $locationType->id)->count();
            if ($usedCount > 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Aksi Ditolak: Tipe lokasi '{$locationType->name}' ({$locationType->prefix_code}) tidak dapat dihapus secara permanen karena masih terhubung dengan {$usedCount} data rak/etalase pada tabel 'racks' (termasuk rak di dalam Trash)."
                ]);
            }

            $name = $locationType->name;
            $locationType->forceDelete();
            AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN tipe lokasi: {$name}");
            DB::commit();
            return back()->with('success', "Tipe Lokasi {$name} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroyLocationType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:location_types,id',
        ]);

        // Soft delete SELALU diizinkan
        DB::beginTransaction();
        try {
            $types = LocationType::whereIn('id', $validated['ids'])->get();
            foreach ($types as $type) {
                $type->delete();
            }
            AuditLog::record('referensi', 'BULK_DELETE', 'Memindahkan ' . count($types) . ' tipe lokasi ke keranjang sampah.');
            DB::commit();
            return back()->with('success', count($types) . ' tipe lokasi berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestoreLocationType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $types = LocationType::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($types as $type) {
                $type->restore();
            }
            AuditLog::record('referensi', 'BULK_RESTORE', 'Memulihkan ' . count($types) . ' tipe lokasi dari keranjang sampah.');
            DB::commit();
            return back()->with('success', count($types) . ' tipe lokasi berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal pulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function bulkForceDeleteLocationType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $types = LocationType::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNames = [];

            foreach ($types as $type) {
                $usedCount = \App\Models\Rack::withTrashed()->where('location_type_id', $type->id)->count();
                if ($usedCount > 0) {
                    $failedNames[] = "{$type->name} ({$usedCount} rak pada racks)";
                    continue;
                }

                $name = $type->name;
                $type->forceDelete();
                AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN tipe lokasi: {$name} (bulk)");
                $deletedCount++;
            }

            if (count($failedNames) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh tipe lokasi terpilih tidak dapat dihapus permanen karena masih terhubung dengan data rak/etalase: ' . implode('; ', $failedNames) . ' (termasuk rak di dalam Trash).'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} tipe lokasi berhasil dihapus secara permanen.";
            if (count($failedNames) > 0) {
                $message .= ' Namun ' . count($failedNames) . ' tipe lokasi dilewati karena masih terhubung dengan data rak/etalase: ' . implode('; ', $failedNames) . '.';
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }

    // ─── SUPPLIER TYPE ───────────────────────────────────────────────────────

    public function storeSupplierType(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'prefix_code'  => 'required|string|max:10|unique:supplier_types,prefix_code',
            'description'  => 'nullable|string',
        ]);
        $validated['prefix_code'] = strtoupper($validated['prefix_code']);

        $type = SupplierType::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan tipe supplier: {$type->name}");
        return back()->with('success', 'Tipe Supplier berhasil ditambahkan!');
    }

    public function updateSupplierType(Request $request, SupplierType $supplierType)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
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
        // Soft delete SELALU diizinkan — tidak perlu cek relasi
        DB::beginTransaction();
        try {
            $name = $supplierType->name;
            $supplierType->delete(); // soft delete
            AuditLog::record('referensi', 'DELETE', "Memindahkan tipe supplier '{$name}' ke keranjang sampah.");
            DB::commit();
            return back()->with('success', "Tipe Supplier {$name} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    public function restoreSupplierType($id)
    {
        DB::beginTransaction();
        try {
            $supplierType = SupplierType::onlyTrashed()->findOrFail($id);
            $supplierType->restore();
            AuditLog::record('referensi', 'RESTORE', "Memulihkan tipe supplier: {$supplierType->name}");
            DB::commit();
            return back()->with('success', "Tipe Supplier {$supplierType->name} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan: ' . $e->getMessage()]);
        }
    }

    public function forceDeleteSupplierType($id)
    {
        DB::beginTransaction();
        try {
            $supplierType = SupplierType::onlyTrashed()->findOrFail($id);

            // Cegah force delete jika masih ada supplier (aktif maupun soft-deleted) yang menggunakan tipe ini
            $usedCount = Supplier::withTrashed()->where('supplier_type_id', $supplierType->id)->count();
            if ($usedCount > 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => "Aksi Ditolak: Tipe supplier '{$supplierType->name}' ({$supplierType->prefix_code}) tidak dapat dihapus secara permanen karena masih terhubung dengan {$usedCount} data pemasok pada tabel 'suppliers' (termasuk pemasok di dalam Trash)."
                ]);
            }

            $name = $supplierType->name;
            $supplierType->forceDelete();
            AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN tipe supplier: {$name}");
            DB::commit();
            return back()->with('success', "Tipe Supplier {$name} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroySupplierType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:supplier_types,id',
        ]);

        // Soft delete SELALU diizinkan
        DB::beginTransaction();
        try {
            $types = SupplierType::whereIn('id', $validated['ids'])->get();
            foreach ($types as $type) {
                $type->delete();
            }
            AuditLog::record('referensi', 'BULK_DELETE', 'Memindahkan ' . count($types) . ' tipe supplier ke keranjang sampah.');
            DB::commit();
            return back()->with('success', count($types) . ' tipe supplier berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestoreSupplierType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $types = SupplierType::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($types as $type) {
                $type->restore();
            }
            AuditLog::record('referensi', 'BULK_RESTORE', 'Memulihkan ' . count($types) . ' tipe supplier dari keranjang sampah.');
            DB::commit();
            return back()->with('success', count($types) . ' tipe supplier berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal pulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function bulkForceDeleteSupplierType(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $types = SupplierType::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNames = [];

            foreach ($types as $type) {
                $usedCount = Supplier::withTrashed()->where('supplier_type_id', $type->id)->count();
                if ($usedCount > 0) {
                    $failedNames[] = "{$type->name} ({$usedCount} pemasok pada suppliers)";
                    continue;
                }

                $name = $type->name;
                $type->forceDelete();
                AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN tipe supplier: {$name} (bulk)");
                $deletedCount++;
            }

            if (count($failedNames) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh tipe supplier terpilih tidak dapat dihapus permanen karena masih terhubung dengan data pemasok: ' . implode('; ', $failedNames) . ' (termasuk pemasok di dalam Trash).'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} tipe supplier berhasil dihapus secara permanen.";
            if (count($failedNames) > 0) {
                $message .= ' Namun ' . count($failedNames) . ' tipe supplier dilewati karena masih terhubung dengan data pemasok: ' . implode('; ', $failedNames) . '.';
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }

    // ─── MEDICINE CATEGORY ────────────────────────────────────────────────────

    public function storeMedicineCategory(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:medicine_categories,name',
            'description' => 'nullable|string',
        ]);

        $category = MedicineCategory::create($validated);
        AuditLog::record('referensi', 'CREATE', "Menambahkan golongan obat: {$category->name}");
        return back()->with('success', 'Golongan obat berhasil ditambahkan!');
    }

    public function updateMedicineCategory(Request $request, MedicineCategory $medicineCategory)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:medicine_categories,name,' . $medicineCategory->id,
            'description' => 'nullable|string',
        ]);

        $medicineCategory->update($validated);
        AuditLog::record('referensi', 'UPDATE', "Memperbarui golongan obat: {$medicineCategory->name}");
        return back()->with('success', 'Golongan obat berhasil diperbarui!');
    }

    public function destroyMedicineCategory(MedicineCategory $medicineCategory)
    {
        // Soft delete SELALU diizinkan — tidak perlu cek relasi (FK tidak dilanggar)
        DB::beginTransaction();
        try {
            $name = $medicineCategory->name;
            $medicineCategory->delete(); // soft delete
            AuditLog::record('referensi', 'DELETE', "Memindahkan golongan obat '{$name}' ke keranjang sampah.");
            DB::commit();
            return back()->with('success', "Golongan obat {$name} berhasil dipindahkan ke tong sampah.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }

    public function restoreMedicineCategory($id)
    {
        DB::beginTransaction();
        try {
            $category = MedicineCategory::onlyTrashed()->findOrFail($id);
            $category->restore();
            AuditLog::record('referensi', 'RESTORE', "Memulihkan golongan obat: {$category->name}");
            DB::commit();
            return back()->with('success', "Golongan obat {$category->name} berhasil dipulihkan.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan: ' . $e->getMessage()]);
        }
    }

    public function forceDeleteMedicineCategory($id)
    {
        DB::beginTransaction();
        try {
            $category  = MedicineCategory::onlyTrashed()->findOrFail($id);
            $usedCount = \App\Models\Medicine::withTrashed()->where('medicine_category_id', $category->id)->count();
            if ($usedCount > 0) {
                DB::rollBack();
                return back()->withErrors(['message' => "Aksi Ditolak: Golongan obat '{$category->name}' tidak dapat dihapus secara permanen karena masih terhubung dengan {$usedCount} data obat pada tabel 'medicines' (termasuk obat di dalam Trash)."]);
            }

            $name = $category->name;
            $category->forceDelete();
            AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN golongan obat: {$name}");
            DB::commit();
            return back()->with('success', "Golongan obat {$name} berhasil dihapus permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroyMedicineCategory(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:medicine_categories,id',
        ]);

        // Soft delete SELALU diizinkan — langsung pindah ke trash tanpa cek relasi
        DB::beginTransaction();
        try {
            $categories = MedicineCategory::whereIn('id', $validated['ids'])->get();
            foreach ($categories as $cat) {
                $cat->delete();
            }
            AuditLog::record('referensi', 'BULK_DELETE', 'Memindahkan ' . count($categories) . ' golongan obat ke keranjang sampah.');
            DB::commit();
            return back()->with('success', count($categories) . ' golongan obat berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus massal: ' . $e->getMessage()]);
        }
    }

    public function bulkRestoreMedicineCategory(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $categories = MedicineCategory::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($categories as $cat) {
                $cat->restore();
            }
            AuditLog::record('referensi', 'BULK_RESTORE', 'Memulihkan ' . count($categories) . ' golongan obat dari keranjang sampah.');
            DB::commit();
            return back()->with('success', count($categories) . ' golongan obat berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal pulihkan massal: ' . $e->getMessage()]);
        }
    }

    public function bulkForceDeleteMedicineCategory(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $categories = MedicineCategory::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $deletedCount = 0;
            $failedNames = [];

            foreach ($categories as $cat) {
                $usedCount = \App\Models\Medicine::withTrashed()->where('medicine_category_id', $cat->id)->count();
                if ($usedCount > 0) {
                    $failedNames[] = "{$cat->name} ({$usedCount} obat pada medicines)";
                    continue;
                }

                $name = $cat->name;
                $cat->forceDelete();
                AuditLog::record('referensi', 'FORCE DELETE', "Menghapus PERMANEN golongan obat: {$name} (bulk)");
                $deletedCount++;
            }

            if (count($failedNames) > 0 && $deletedCount === 0) {
                DB::rollBack();
                return back()->withErrors([
                    'message' => 'Seluruh golongan obat terpilih tidak dapat dihapus permanen karena masih terhubung dengan data obat: ' . implode('; ', $failedNames) . ' (termasuk obat di dalam Trash).'
                ]);
            }

            DB::commit();

            $message = "{$deletedCount} golongan obat berhasil dihapus secara permanen.";
            if (count($failedNames) > 0) {
                $message .= ' Namun ' . count($failedNames) . ' golongan obat dilewati karena masih terhubung dengan data obat: ' . implode('; ', $failedNames) . '.';
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }
}
