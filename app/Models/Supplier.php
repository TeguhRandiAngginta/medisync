<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;
    protected $guarded = ['id'];

    public function supplierType()
    {
        return $this->belongsTo(SupplierType::class, 'supplier_type_id');
    }

    public function getCodeAttribute($value)
    {
        $parts = explode('-', $value, 2);
        $number = count($parts) > 1 ? $parts[1] : $value;
        
        if ($this->supplierType && $this->relationLoaded('supplierType')) {
            return $this->supplierType->prefix_code . '-' . $number;
        }
        return $value;
    }
}