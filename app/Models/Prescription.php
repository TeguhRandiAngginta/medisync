<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}