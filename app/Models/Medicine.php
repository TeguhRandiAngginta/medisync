<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medicine extends Model
{
    use HasFactory, SoftDeletes;

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
        'stock',
        'is_active',
        'selling_price',
    ];

    protected $casts = [
        'requires_prescription' => 'boolean',
        'is_active' => 'boolean',
    ];

    /** Obat aktif yang stoknya sudah di/bawah batas minimumnya sendiri (min_stock). */
    public function scopeLowStock($query)
    {
        return $query->where('is_active', true)->whereColumn('stock', '<=', 'min_stock');
    }

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

    public function batches()
    {
        return $this->hasMany(ProductBatch::class, 'medicine_id');
    }
}