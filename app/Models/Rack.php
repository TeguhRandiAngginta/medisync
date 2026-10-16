<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rack extends Model
{
    use SoftDeletes;
    
    protected $guarded = ['id'];
    
    public function locationType()
    {
        return $this->belongsTo(LocationType::class, 'location_type_id');
    }

    public function getCodeAttribute($value)
    {
        if ($this->locationType && $this->relationLoaded('locationType')) {
            $parts = explode('-', $value, 2);
            if (count($parts) > 1) {
                return $this->locationType->prefix_code . '-' . $parts[1];
            }
        }
        return $value;
    }
}