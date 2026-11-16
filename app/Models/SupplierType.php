<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierType extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'prefix_code', 'description'];

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }
}