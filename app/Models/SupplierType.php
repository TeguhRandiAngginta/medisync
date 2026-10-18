<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SupplierType extends Model
{
    protected $fillable = ['name', 'prefix_code', 'description'];
}