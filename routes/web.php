<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:superadmin,apoteker'])->group(function () {
    
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');

    Route::get('/suppliers', [\App\Http\Controllers\SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/suppliers/create', [\App\Http\Controllers\SupplierController::class, 'create'])->name('suppliers.create');
    Route::post('/suppliers', [\App\Http\Controllers\SupplierController::class, 'store'])->name('suppliers.store');

    Route::get('/racks', [\App\Http\Controllers\RackController::class, 'index'])->name('racks.index');
    Route::get('/racks/create', [\App\Http\Controllers\RackController::class, 'create'])->name('racks.create');
    Route::post('/racks', [\App\Http\Controllers\RackController::class, 'store'])->name('racks.store');

    Route::get('/doctors', [\App\Http\Controllers\DoctorController::class, 'index'])->name('doctors.index');
    Route::get('/doctors/create', [\App\Http\Controllers\DoctorController::class, 'create'])->name('doctors.create');
    Route::post('/doctors', [\App\Http\Controllers\DoctorController::class, 'store'])->name('doctors.store');

    Route::get('/patients', [\App\Http\Controllers\PatientController::class, 'index'])->name('patients.index');
    Route::get('/patients/create', [\App\Http\Controllers\PatientController::class, 'create'])->name('patients.create');
    Route::post('/patients', [\App\Http\Controllers\PatientController::class, 'store'])->name('patients.store');

});

require __DIR__.'/auth.php';