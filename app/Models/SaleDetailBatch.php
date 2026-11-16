<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleDetailBatch extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function saleDetail()
    {
        return $this->belongsTo(SaleDetail::class);
    }

    public function productBatch()
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
