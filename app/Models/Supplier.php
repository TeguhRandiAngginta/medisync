<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    // Tambahkan baris ini agar Eloquent mengizinkan Supplier::create()
    protected $guarded = ['id'];
}