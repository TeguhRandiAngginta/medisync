<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $guarded = ['id'];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function record($module, $action, $description)
    {
        self::create([
            'user_id' => auth()->id(),
            'module' => strtolower($module),
            'action' => strtoupper($action),
            'description' => $description,
            'ip_address' => request()->ip(),
        ]);
    }
}