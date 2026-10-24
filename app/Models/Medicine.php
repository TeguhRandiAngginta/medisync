<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medicine extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'medicine_category_id',
        'supplier_id',
        'rack_id',
        'sku',
        'barcode',
        'name',
        'generic_name',
        'dosage_form',
        'dosage_strength',
        'requires_prescription',
        'base_unit',
        'min_stock',
        'max_stock',
        'is_active',
        'selling_price',
    ];

    protected $casts = [
        'requires_prescription' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(MedicineCategory::class, 'medicine_category_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function rack()
    {
        return $this->belongsTo(Rack::class);
    }
}