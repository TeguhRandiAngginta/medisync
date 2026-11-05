<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'purchase_detail_id',
        'batch_number',
        'stock_quantity',
        'expired_date',
        'purchase_price',
    ];

    public function product()
    {
        return $this->belongsTo(Medicine::class, 'product_id');
    }

    public function purchaseDetail()
    {
        return $this->belongsTo(PurchaseDetail::class, 'purchase_detail_id');
    }
}