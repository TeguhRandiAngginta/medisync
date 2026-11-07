<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesHistoryController extends Controller
{
    private function checkOwnerAccess()
    {
        $user = auth()->user();

        $roleSlug = $user->role->slug ?? '';

        if (!in_array($roleSlug, ['superadmin', 'owner'])) {
            abort(403, 'Akses Ditolak: Hanya Owner atau Superadmin yang memiliki hak akses untuk mengubah riwayat transaksi.');
        }
    }

    public function index(Request $request)
    {
        $sales = Sale::with(['user', 'details.medicine'])
            ->orderBy('sale_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'isTrash' => false,
        ]);
    }

    public function trash(Request $request)
    {
        $sales = Sale::onlyTrashed()
            ->with(['user', 'details.medicine'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'isTrash' => true,
        ]);
    }

    public function destroy($id)
    {
        $this->checkOwnerAccess();

        DB::transaction(function () use ($id) {
            $sale = Sale::findOrFail($id);
            $sale->delete(); 
        });

        return redirect()->back()->with('success', 'Transaksi penjualan berhasil dipindahkan ke sampah.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->checkOwnerAccess();

        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:sales,id',
        ]);

        DB::transaction(function () use ($request) {
            $sales = Sale::whereIn('id', $request->ids)->get();

            foreach ($sales as $sale) {
                $sale->delete(); 
            }
        });

        return redirect()->back()->with('success', count($request->ids) . ' transaksi berhasil dipindahkan ke sampah.');
    }

    public function restore($id)
    {
        $this->checkOwnerAccess();

        DB::transaction(function () use ($id) {
            $sale = Sale::onlyTrashed()->findOrFail($id);
            $sale->restore();
        });

        return redirect()->back()->with('success', 'Transaksi berhasil dipulihkan.');
    }

    public function bulkRestore(Request $request)
    {
        $this->checkOwnerAccess();

        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:sales,id',
        ]);

        DB::transaction(function () use ($request) {
            Sale::onlyTrashed()->whereIn('id', $request->ids)->restore();
        });

        return redirect()->back()->with('success', count($request->ids) . ' transaksi berhasil dipulihkan.');
    }

    public function forceDelete($id)
    {
        $this->checkOwnerAccess();

        DB::transaction(function () use ($id) {
            $sale = Sale::onlyTrashed()->findOrFail($id);
            $sale->forceDelete();
        });

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus secara permanen.');
    }
}