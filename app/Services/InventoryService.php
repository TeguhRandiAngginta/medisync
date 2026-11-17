<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\StockAdjustment;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Potong stok per batch dengan urutan FEFO.
     *
     * Batch yang sudah kedaluwarsa dilewati (tidak boleh dijual), kecuali
     * $includeExpired = true (dipakai saat memulihkan transaksi lama yang
     * dulu terjual ketika batch tersebut masih valid).
     */
    public static function deductStockFEFO(int $medicineId, int $requestedQty, bool $includeExpired = false): array
    {
        $medicine = Medicine::where('id', $medicineId)->lockForUpdate()->first();

        if (!$medicine) {
            throw new Exception("Obat dengan ID {$medicineId} tidak ditemukan.");
        }

        $batches = ProductBatch::where('medicine_id', $medicineId)
            ->where('stock_quantity', '>', 0)
            ->when(!$includeExpired, fn ($q) => $q->whereDate('expired_date', '>=', now()->toDateString()))
            ->orderBy('expired_date', 'asc')
            ->lockForUpdate()
            ->get();

        $totalAvailableStock = $batches->sum('stock_quantity');

        if ($totalAvailableStock < $requestedQty) {
            throw new Exception("Stok batch obat '{$medicine->name}' tidak mencukupi (batch kedaluwarsa tidak dihitung). Dibutuhkan: {$requestedQty}, Tersedia: {$totalAvailableStock}.");
        }

        $remainingToDeduct = $requestedQty;
        $totalCostOfGoodsSold = 0.0;
        $deductedBatches = [];

        foreach ($batches as $batch) {
            if ($remainingToDeduct <= 0) {
                break;
            }

            $deductQty = min($remainingToDeduct, $batch->stock_quantity);
            $batchPurchasePrice = (float) ($batch->purchase_price ?? $medicine->purchase_price ?? 0);
            
            $totalCostOfGoodsSold += ($deductQty * $batchPurchasePrice);

            $deductedBatches[] = [
                'product_batch_id' => $batch->id,
                'batch_number'     => $batch->batch_number,
                'quantity'         => $deductQty,
                'purchase_price'   => $batchPurchasePrice,
            ];

            if ($batch->stock_quantity >= $remainingToDeduct) {
                $batch->decrement('stock_quantity', $remainingToDeduct);
                $remainingToDeduct = 0;
            } else {
                $remainingToDeduct -= $batch->stock_quantity;
                $batch->update(['stock_quantity' => 0]);
            }
        }

        self::syncMedicineStock($medicineId);

        // LOG PERGERAKAN STOK KELUAR (POS / KASIR)
        if (class_exists(AuditLog::class)) {
            AuditLog::record(
                'stok', 
                'UPDATE', 
                "Pengurangan stok FEFO otomatis sebesar {$requestedQty} unit untuk obat '{$medicine->name}' melalui transaksi POS/Kasir."
            );
        }

        $unitHpp = $requestedQty > 0 ? ($totalCostOfGoodsSold / $requestedQty) : 0.0;
        $primaryBatchNumber = !empty($deductedBatches) ? $deductedBatches[0]['batch_number'] : 'BATCH-AUTO';

        return [
            'unit_hpp'     => $unitHpp,
            'batch_number' => $primaryBatchNumber,
            'batches'      => $deductedBatches,
        ];
    }

    public static function recordSaleDetailBatches(int $saleDetailId, array $batches): void
    {
        if (empty($batches) || !DB::getSchemaBuilder()->hasTable('sale_detail_batches')) {
            return;
        }

        // Ganti (bukan tambah) rincian batch: baris lama sudah dikembalikan ke stok
        // saat transaksi dihapus, jika dibiarkan akan dikembalikan dua kali.
        DB::table('sale_detail_batches')->where('sale_detail_id', $saleDetailId)->delete();

        foreach ($batches as $batch) {
            DB::table('sale_detail_batches')->insert([
                'sale_detail_id'   => $saleDetailId,
                'product_batch_id' => $batch['product_batch_id'],
                'quantity'         => $batch['quantity'],
                'purchase_price'   => $batch['purchase_price'],
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }
    }

    public static function restoreStockFEFO(int $medicineId, int $quantity, ?string $batchNumber = null, ?int $saleDetailId = null): void
    {
        DB::transaction(function () use ($medicineId, $quantity, $batchNumber, $saleDetailId) {
            $restored = false;

            // 1. Prioritaskan pengembalian ke batch spesifik dari sale_detail_batches jika tersedia
            if ($saleDetailId && DB::getSchemaBuilder()->hasTable('sale_detail_batches')) {
                $detailBatches = DB::table('sale_detail_batches')
                    ->where('sale_detail_id', $saleDetailId)
                    ->get();

                if ($detailBatches->isNotEmpty()) {
                    foreach ($detailBatches as $detailBatch) {
                        $batch = ProductBatch::where('id', $detailBatch->product_batch_id)
                            ->lockForUpdate()
                            ->first();

                        if ($batch) {
                            $batch->increment('stock_quantity', $detailBatch->quantity);
                        }
                    }
                    $restored = true;
                }
            }

            // 2. Jika belum dipulihkan lewat sale_detail_batches, coba cocokkan lewat batch_number asal
            if (!$restored && !empty($batchNumber) && $batchNumber !== 'BATCH-AUTO') {
                $batch = ProductBatch::where('medicine_id', $medicineId)
                    ->where('batch_number', $batchNumber)
                    ->lockForUpdate()
                    ->first();

                if ($batch) {
                    $batch->increment('stock_quantity', $quantity);
                    $restored = true;
                }
            }

            // 3. Fallback: ambil batch terbaru dengan lockForUpdate()
            if (!$restored) {
                $batch = ProductBatch::where('medicine_id', $medicineId)
                    ->orderBy('expired_date', 'desc')
                    ->lockForUpdate()
                    ->first();

                if ($batch) {
                    $batch->increment('stock_quantity', $quantity);
                }
            }

            self::syncMedicineStock($medicineId);

            // LOG PERGERAKAN STOK KEMBALI (RESTORE / BATAL TRANSAKSI)
            if (class_exists(AuditLog::class)) {
                $medicine = Medicine::find($medicineId);
                $medicineName = $medicine ? $medicine->name : 'Obat Tidak Diketahui';
                
                AuditLog::record(
                    'stok', 
                    'RESTORE', 
                    "Pengembalian stok otomatis sebesar {$quantity} unit untuk obat '{$medicineName}' akibat pembatalan atau penghapusan transaksi."
                );
            }
        });
    }

    public static function syncMedicineStock(int $medicineId): void
    {
        $totalBatchStock = ProductBatch::where('medicine_id', $medicineId)->sum('stock_quantity');
        Medicine::where('id', $medicineId)->update(['stock' => $totalBatchStock]);
    }

    public static function adjustBatchStock(int $batchId, int $actualStock, string $type, ?string $notes = null): void
    {
        DB::transaction(function () use ($batchId, $actualStock, $type, $notes) {
            $batch = ProductBatch::where('id', $batchId)->lockForUpdate()->firstOrFail();
            $systemStock = $batch->stock_quantity;
            $medicineName = $batch->medicine->name ?? 'Obat Tidak Diketahui';
            
            $difference = $actualStock - $systemStock;

            $batch->update(['stock_quantity' => $actualStock]);

            StockAdjustment::create([
                'medicine_id'      => $batch->medicine_id,
                'product_batch_id' => $batch->id,
                'user_id'          => \Illuminate\Support\Facades\Auth::id(),
                'system_stock'     => $systemStock,
                'actual_stock'     => $actualStock,
                'difference'       => $difference,
                'type'             => $type,
                'notes'            => $notes,
            ]);

            self::syncMedicineStock($batch->medicine_id);
            if (class_exists(AuditLog::class)) {
                $statusType = $difference > 0 ? "PENAMBAHAN" : ($difference < 0 ? "PENGURANGAN" : "PENYESUAIAN");
                $diffAbs = abs($difference);
                
                AuditLog::record(
                    'stok', 
                    'UPDATE', 
                    "Stok Opname / Penyesuaian {$statusType} obat {$medicineName} (Batch: {$batch->batch_number}). Stok Sistem: {$systemStock}, Realita: {$actualStock} (Selisih: {$diffAbs})."
                );
            }
        });
    }
}