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
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all');
        $date = $request->get('date');

        $query = Sale::with(['user', 'details.medicine']);

        if ($filter === 'today') {
            $today = now()->timezone('Asia/Jakarta')->toDateString();
            $query->whereDate('sale_date', $today);
        } elseif ($filter === 'yesterday') {
            $yesterday = now()->timezone('Asia/Jakarta')->subDay()->toDateString();
            $query->whereDate('sale_date', $yesterday);
        } elseif ($filter === 'custom' && !empty($date)) {
            $query->whereDate('sale_date', $date);
        }

        $sales = $query->orderBy('sale_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'isTrash' => false,
            'filters' => [
                'filter' => $filter,
                'date'   => $date,
            ],
        ]);
    }

    public function trash(Request $request)
    {
        $filter = $request->get('filter', 'all');
        $date = $request->get('date');

        $query = Sale::onlyTrashed()
            ->with(['user', 'details.medicine']);

        if ($filter === 'today') {
            $today = now()->timezone('Asia/Jakarta')->toDateString();
            $query->whereDate('deleted_at', $today);
        } elseif ($filter === 'yesterday') {
            $yesterday = now()->timezone('Asia/Jakarta')->subDay()->toDateString();
            $query->whereDate('deleted_at', $yesterday);
        } elseif ($filter === 'custom' && !empty($date)) {
            $query->whereDate('deleted_at', $date);
        }

        $sales = $query->orderBy('deleted_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'isTrash' => true,
            'filters' => [
                'filter' => $filter,
                'date'   => $date,
            ],
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
            Sale::onlyTrashed()->whereIn('id', $request->ids)->get()->each->restore();
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