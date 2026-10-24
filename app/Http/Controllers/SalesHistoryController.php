<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesHistoryController extends Controller
{
    public function index()
    {
        $sales = Sale::with(['details.medicine', 'user'])
                    ->latest()
                    ->paginate(15);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'isTrash' => false
        ]);
    }

    public function trash()
    {
        $sales = Sale::onlyTrashed()
                    ->with(['details.medicine', 'user'])
                    ->latest('deleted_at')
                    ->paginate(15);

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'isTrash' => true
        ]);
    }

    public function destroy($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->delete();

        return redirect()->back()->with('success', 'Riwayat penjualan berhasil dipindahkan ke sampah.');
    }

    public function restore($id)
    {
        $sale = Sale::onlyTrashed()->findOrFail($id);
        $sale->restore();

        return redirect()->back()->with('success', 'Riwayat penjualan berhasil dipulihkan.');
    }

    public function forceDelete($id)
    {
        $sale = Sale::onlyTrashed()->findOrFail($id);
        
        $sale->details()->delete();
        $sale->forceDelete();

        return redirect()->back()->with('success', 'Riwayat penjualan berhasil dihapus permanen.');
    }
}