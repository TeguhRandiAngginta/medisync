<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationType extends Model
{
    protected $fillable = [
        'name',
        'prefix_code',
        'intended_for',
        'description',
    ];
}