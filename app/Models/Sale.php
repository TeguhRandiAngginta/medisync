<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\InventoryService;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

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
    }
}