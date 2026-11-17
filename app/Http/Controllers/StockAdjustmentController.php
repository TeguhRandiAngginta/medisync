<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\StockAdjustment;
use App\Models\AuditLog;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $trashed = $request->boolean('trashed', false);

        $query = StockAdjustment::with(['medicine', 'productBatch', 'user'])
            ->when($trashed, fn($q) => $q->onlyTrashed(), fn($q) => $q->withoutTrashed())
            ->orderBy($trashed ? 'deleted_at' : 'created_at', 'desc');

        $adjustments = $query->paginate(15)->withQueryString();
        $trashedCount = StockAdjustment::onlyTrashed()->count();

        return Inertia::render('StockOpname/Index', [
            'adjustments'  => $adjustments,
            'trashed'      => $trashed,
            'trashedCount' => $trashedCount,
        ]);
    }

    private const MEDICINE_SEARCH_LIMIT = 20;

    public function create()
    {
        // Hanya daftar awal; pencarian selanjutnya lewat searchMedicines() agar katalog besar tidak dimuat sekaligus.
        return Inertia::render('StockOpname/Create', [
            'medicines' => $this->medicineOptions(''),
        ]);
    }

    /** Pencarian obat (nama, SKU, zat aktif) beserta batch-nya untuk combobox form opname. */
    public function searchMedicines(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:100']);

        return response()->json($this->medicineOptions(trim((string) $request->query('q', ''))));
    }

    private function medicineOptions(string $term)
    {
        // Karakter escape '!' (bukan backslash: PDO pgsql salah mengurai '\' di dalam SQL).
        $like = '%' . mb_strtolower(str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term)) . '%';

        return Medicine::with(['batches' => fn ($q) => $q->orderBy('expired_date', 'asc')])
            ->when($term !== '', function ($q) use ($like) {
                $q->where(function ($w) use ($like) {
                    foreach (['name', 'sku', 'generic_name'] as $column) {
                        // LOWER + LIKE ... ESCAPE: portabel (PostgreSQL dan SQLite), % dan _ dari input tidak jadi wildcard
                        $w->orWhereRaw("LOWER({$column}) LIKE ? ESCAPE '!'", [$like]);
                    }
                });
            })
            ->orderBy('name')
            ->limit(self::MEDICINE_SEARCH_LIMIT)
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_batch_id' => 'required|exists:product_batches,id',
            'actual_stock' => 'required|integer|min:0',
            'type' => 'required|in:DAMAGE,EXPIRED,LOST,CORRECTION',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            InventoryService::adjustBatchStock(
                $request->product_batch_id,
                $request->actual_stock,
                $request->type,
                $request->notes
            );

            return redirect()->route('stock-adjustments.index')->with('success', 'Stock opname berhasil dicatat dan stok disesuaikan!');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal memperbarui stok: ' . $e->getMessage()]);
        }
    }

    /**
     * Soft delete stock adjustment and rollback the batch stock adjustment
     * (difference = actual - system; rollback: decrement by difference)
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $this->rollbackAdjustmentStock($adjustment);
            $adjustment->delete();

            if (class_exists(AuditLog::class)) {
                $medName = $adjustment->medicine->name ?? 'Obat';
                AuditLog::record(
                    'stok',
                    'DELETE',
                    "Membatalkan penyesuaian stok ID #{$adjustment->id} obat '{$medName}' dan mengembalikan stok batch ke kondisi sebelum opname."
                );
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index')
                ->with('success', 'Catatan stock opname berhasil dipindahkan ke tong sampah dan saldo stok dikembalikan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal membatalkan stock opname: ' . $e->getMessage()]);
        }
    }

    /**
     * Restore stock adjustment and re-apply the difference to batch stock
     */
    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::onlyTrashed()->findOrFail($id);
            $this->reapplyAdjustmentStock($adjustment);
            $adjustment->restore();

            if (class_exists(AuditLog::class)) {
                $medName = $adjustment->medicine->name ?? 'Obat';
                AuditLog::record(
                    'stok',
                    'RESTORE',
                    "Memulihkan catatan stock opname ID #{$adjustment->id} obat '{$medName}' dan menerapkan ulang penyesuaian stok ke batch."
                );
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index', ['trashed' => true])
                ->with('success', 'Catatan stock opname berhasil dipulihkan dan saldo stok disesuaikan kembali.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan stock opname: ' . $e->getMessage()]);
        }
    }

    /**
     * Permanently delete stock adjustment from trash
     * Note: Stock is NOT modified again on forceDelete because it was already rolled back during destroy!
     */
    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $adjustment = StockAdjustment::onlyTrashed()->findOrFail($id);
            $adjId = $adjustment->id;
            $medName = $adjustment->medicine->name ?? 'Obat';

            $adjustment->forceDelete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'stok',
                    'FORCE DELETE',
                    "Menghapus PERMANEN catatan audit stock opname ID #{$adjId} obat '{$medName}' dari database."
                );
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index', ['trashed' => true])
                ->with('success', "Catatan stock opname #{$adjId} berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus permanen: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:stock_adjustments,id',
        ]);

        DB::beginTransaction();
        try {
            $adjustments = StockAdjustment::whereIn('id', $validated['ids'])->get();
            foreach ($adjustments as $adj) {
                $this->rollbackAdjustmentStock($adj);
                $adj->delete();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('stok', 'BULK_DELETE', 'Memindahkan ' . count($adjustments) . ' catatan stock opname ke tong sampah dan mengembalikan saldo stok.');
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index')
                ->with('success', count($adjustments) . ' catatan stock opname berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal membatalkan massal: ' . $e->getMessage()]);
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
            $adjustments = StockAdjustment::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            foreach ($adjustments as $adj) {
                $this->reapplyAdjustmentStock($adj);
                $adj->restore();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('stok', 'BULK_RESTORE', 'Memulihkan ' . count($adjustments) . ' catatan stock opname dari tong sampah dan menerapkan ulang penyesuaian stok.');
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index', ['trashed' => true])
                ->with('success', count($adjustments) . ' catatan stock opname berhasil dipulihkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan massal: ' . $e->getMessage()]);
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
            $adjustments = StockAdjustment::onlyTrashed()->whereIn('id', $validated['ids'])->get();
            $count = $adjustments->count();

            foreach ($adjustments as $adj) {
                $adj->forceDelete();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('stok', 'FORCE DELETE', "Menghapus PERMANEN {$count} catatan audit stock opname dari database (bulk).");
            }

            DB::commit();
            return redirect()->route('stock-adjustments.index', ['trashed' => true])
                ->with('success', "{$count} catatan stock opname berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }

    /**
     * Batalkan efek opname: stok batch dikurangi/ditambah kebalikan dari selisih (difference = actual - system).
     * Dibatalkan bila hasilnya akan negatif atau batch tidak tersedia, bukan dipaksa ke 0 (selisih hilang diam-diam).
     */
    private function rollbackAdjustmentStock(StockAdjustment $adjustment): void
    {
        $this->applyAdjustmentDelta($adjustment, -$adjustment->difference, 'dibatalkan');
    }

    /** Terapkan ulang efek opname saat dipulihkan dari trash. */
    private function reapplyAdjustmentStock(StockAdjustment $adjustment): void
    {
        $this->applyAdjustmentDelta($adjustment, $adjustment->difference, 'dipulihkan');
    }

    /**
     * @throws \Exception bila stok batch sudah berubah sehingga operasi akan menghasilkan stok negatif,
     *                    atau batch sudah tidak ada (mis. faktur pembeliannya ada di trash).
     */
    private function applyAdjustmentDelta(StockAdjustment $adjustment, int $delta, string $verb): void
    {
        if (!$adjustment->product_batch_id) {
            if ($adjustment->medicine_id) {
                InventoryService::syncMedicineStock($adjustment->medicine_id);
            }
            return;
        }

        $batch = ProductBatch::where('id', $adjustment->product_batch_id)->lockForUpdate()->first();

        if (!$batch) {
            throw new \Exception("Opname #{$adjustment->id} tidak dapat {$verb}: batch terkait sudah dihapus (periksa faktur pembelian di trash).");
        }

        $newStock = $batch->stock_quantity + $delta;

        if ($newStock < 0) {
            throw new \Exception(
                "Opname #{$adjustment->id} tidak dapat {$verb}: stok batch '{$batch->batch_number}' saat ini {$batch->stock_quantity}, "
                . "operasi ini akan membuat stok menjadi {$newStock}. Stok sudah berubah sejak opname dicatat."
            );
        }

        $batch->update(['stock_quantity' => $newStock]);
        InventoryService::syncMedicineStock($batch->medicine_id);
    }
}
