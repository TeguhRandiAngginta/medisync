<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        'prescription_number', 'patient_name', 'doctor_name', 'prescription_date',
        'status', 'notes', 'attachment', 'user_id'
    ];

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}