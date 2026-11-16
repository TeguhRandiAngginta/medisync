<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PrescriptionItem extends Model
{
    use SoftDeletes;
    protected $guarded = [];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class, 'medicine_id');
    }
}