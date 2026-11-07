<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; 

class ProductBatch extends Model
{
    use HasFactory, SoftDeletes; 

    protected $guarded = ['id'];

    public function product()
    {
        return $this->belongsTo(Medicine::class, 'product_id');
    }

    public function purchaseDetail()
    {
        return $this->belongsTo(PurchaseDetail::class, 'purchase_detail_id');
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class, 'medicine_id');
    }
}