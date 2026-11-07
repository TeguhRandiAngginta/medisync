<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    public static function deductStockFEFO(int $medicineId, int $requestedQty): float
    {
        $medicine = Medicine::where('id', $medicineId)->lockForUpdate()->first();

        if (!$medicine) {
            throw new Exception("Obat dengan ID {$medicineId} tidak ditemukan.");
        }

        $batches = ProductBatch::where('medicine_id', $medicineId)
            ->where('stock_quantity', '>', 0)
            ->orderBy('expired_date', 'asc')
            ->lockForUpdate()
            ->get();

        $totalAvailableStock = $batches->sum('stock_quantity');

        if ($totalAvailableStock < $requestedQty) {
            throw new Exception("Stok batch obat '{$medicine->name}' tidak mencukupi. Dibutuhkan: {$requestedQty}, Tersedia: {$totalAvailableStock}.");
        }

        $remainingToDeduct = $requestedQty;
        $totalCostOfGoodsSold = 0.0;

        foreach ($batches as $batch) {
            if ($remainingToDeduct <= 0) {
                break;
            }

            $deductQty = min($remainingToDeduct, $batch->stock_quantity);
            $batchPurchasePrice = (float) ($batch->purchase_price ?? $medicine->purchase_price ?? 0);
            
            $totalCostOfGoodsSold += ($deductQty * $batchPurchasePrice);

            if ($batch->stock_quantity >= $remainingToDeduct) {
                $batch->decrement('stock_quantity', $remainingToDeduct);
                $remainingToDeduct = 0;
            } else {
                $remainingToDeduct -= $batch->stock_quantity;
                $batch->update(['stock_quantity' => 0]);
            }
        }

        self::syncMedicineStock($medicineId);

        return $requestedQty > 0 ? ($totalCostOfGoodsSold / $requestedQty) : 0.0;
    }

    public static function restoreStockFEFO(int $medicineId, int $quantity): void
    {
        DB::transaction(function () use ($medicineId, $quantity) {
            $batch = ProductBatch::where('medicine_id', $medicineId)
                ->orderBy('expired_date', 'desc')
                ->first();

            if ($batch) {
                $batch->increment('stock_quantity', $quantity);
            }

            self::syncMedicineStock($medicineId);
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
        });
    }
}