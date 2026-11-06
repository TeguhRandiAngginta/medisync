<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            $userRole = strtolower($user->role ?? '');

            if (
                $userRole === 'superadmin' || 
                $userRole === 'owner' || 
                (method_exists($user, 'hasRole') && ($user->hasRole('superadmin') || $user->hasRole('owner') || $user->hasRole('Superadmin') || $user->hasRole('Owner')))
            ) {
                return true;
            }
        });
    }
}