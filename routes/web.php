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

Route::middleware(['auth', 'verified', 'role:superadmin,apoteker,kasir,admin'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');

    Route::get('/suppliers', [\App\Http\Controllers\SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/suppliers/create', [\App\Http\Controllers\SupplierController::class, 'create'])->name('suppliers.create');
    Route::post('/suppliers', [\App\Http\Controllers\SupplierController::class, 'store'])->name('suppliers.store');
    Route::get('/suppliers/{supplier}/edit', [\App\Http\Controllers\SupplierController::class, 'edit'])->name('suppliers.edit');
    Route::put('/suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'destroy'])->name('suppliers.destroy');

    Route::get('/racks', [\App\Http\Controllers\RackController::class, 'index'])->name('racks.index');
    Route::get('/racks/create', [\App\Http\Controllers\RackController::class, 'create'])->name('racks.create');
    Route::post('/racks', [\App\Http\Controllers\RackController::class, 'store'])->name('racks.store');
    Route::get('/racks/{rack}/edit', [\App\Http\Controllers\RackController::class, 'edit'])->name('racks.edit');
    Route::put('/racks/{rack}', [\App\Http\Controllers\RackController::class, 'update'])->name('racks.update');
    Route::delete('/racks/{rack}', [\App\Http\Controllers\RackController::class, 'destroy'])->name('racks.destroy');

    Route::get('/audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [\App\Http\Controllers\UserController::class, 'create'])->name('users.create');
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        
        Route::get('/users/{user}/edit', [\App\Http\Controllers\UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::get('/references', [\App\Http\Controllers\ReferenceController::class, 'index'])->name('references.index');
    Route::post('/references/location-types', [\App\Http\Controllers\ReferenceController::class, 'storeLocationType'])->name('references.location-types.store');
    Route::put('/references/location-types/{locationType}', [\App\Http\Controllers\ReferenceController::class, 'updateLocationType'])->name('references.location-types.update');
    Route::delete('/references/location-types/{locationType}', [\App\Http\Controllers\ReferenceController::class, 'destroyLocationType'])->name('references.location-types.destroy');

});

require __DIR__.'/auth.php';