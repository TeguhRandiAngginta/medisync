<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
// Tambahkan 2 baris ini untuk modifikasi email
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

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
        Vite::prefetch(concurrency: 3);

        // Menimpa tampilan email Reset Password bawaan Laravel
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            
            // 1. Buat URL dengan token yang aman
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            // 2. Panggil file blade kustom yang baru saja kita buat
            return (new MailMessage)
                ->subject('Aksi Diperlukan: Atur Ulang Password - MediSync')
                ->view('emails.custom-reset', ['url' => $url]);
        });
    }
}