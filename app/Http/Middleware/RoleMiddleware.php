<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Pastikan user sudah login
        if (!auth()->check()) {
            return redirect('/login');
        }

        $user = auth()->user();
        
        // 2. Periksa apakah user memiliki Role yang diizinkan untuk mengakses halaman
        if (!$user->role || !in_array($user->role->slug, $roles)) {
            abort(403, 'Akses Ditolak: Anda tidak memiliki izin untuk halaman MediSync ini.');
        }

        return $next($request);
    }
}