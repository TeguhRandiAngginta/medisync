<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LocationType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'prefix_code',
        'intended_for',
        'description',
    ];

    public function racks()
    {
        return $this->hasMany(Rack::class);
    }
}