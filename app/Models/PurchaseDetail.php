<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseDetail extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'purchase_id', 'medicine_id', 'batch_number', 
        'expired_date', 'quantity', 'purchase_price', 'subtotal'
    ];

    protected $casts = [
        'expired_date' => 'date',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}