<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\InventoryService;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number', 'user_id', 'total_amount', 'subtotal_amount',
        'discount_amount', 'paid_amount', 'change_amount', 'payment_method',
        'customer_name', 'sale_date', 'status'
    ];

    public function details()
    {
        return $this->hasMany(SaleDetail::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::deleting(function ($sale) {
            if (!$sale->isForceDeleting()) {
                foreach ($sale->details as $detail) {
                    if ($detail->medicine_id && $detail->quantity > 0) {
                        InventoryService::restoreStockFEFO($detail->medicine_id, $detail->quantity);
                    }
                }
            }
        });

        static::restored(function ($sale) {
            foreach ($sale->details as $detail) {
                if ($detail->medicine_id && $detail->quantity > 0) {
                    InventoryService::deductStockFEFO($detail->medicine_id, $detail->quantity);
                }
            }
        });
    }
}