<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\ProductBatch;
use Illuminate\Support\Carbon;

class AlertService
{
    public static function getExpiringBatches(int $daysThreshold = 90)
    {
        $targetDate = Carbon::now()->addDays($daysThreshold);

        return ProductBatch::with('medicine')
            ->where('stock_quantity', '>', 0)
            ->where('expired_date', '<=', $targetDate)
            ->orderBy('expired_date', 'asc')
            ->get()
            ->map(function ($batch) {
                $daysLeft = (int) Carbon::now()->diffInDays(Carbon::parse($batch->expired_date), false);
                $batch->days_left = $daysLeft;
                $batch->status_label = $daysLeft < 0 ? 'EXPIRED' : ($daysLeft <= 30 ? 'CRITICAL' : 'WARNING');
                return $batch;
            });
    }

    public static function getLowStockMedicines()
    {
        return Medicine::where('is_active', true)
            ->whereColumn('stock', '<=', 'min_stock')
            ->get();
    }
}