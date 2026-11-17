<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\AuditLog;
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

    private function isOwner(): bool
    {
        return in_array(auth()->user()->role->slug ?? '', ['superadmin', 'owner']);
    }

    /** Superadmin/owner melihat semua transaksi; kasir dan apoteker hanya miliknya sendiri. */
    private function visibleSales()
    {
        return Sale::query()->when(!$this->isOwner(), fn ($q) => $q->where('user_id', auth()->id()));
    }

    public function index(Request $request)
    {
        $trashed = $request->boolean('trashed', false);

        // Trash (pulihkan/hapus permanen) hanya untuk superadmin/owner.
        if ($trashed) {
            $this->checkOwnerAccess();
        }
        $filter = $request->get('filter', 'all');
        $date = $request->get('date');

        $query = $this->visibleSales()->with(['user', 'details.medicine']);

        if ($trashed) {
            $query->onlyTrashed();
        } else {
            $query->withoutTrashed();
        }

        $dateColumn = $trashed ? 'deleted_at' : 'sale_date';

        if ($filter === 'today') {
            $today = now()->timezone('Asia/Jakarta')->toDateString();
            $query->whereDate($dateColumn, $today);
        } elseif ($filter === 'yesterday') {
            $yesterday = now()->timezone('Asia/Jakarta')->subDay()->toDateString();
            $query->whereDate($dateColumn, $yesterday);
        } elseif ($filter === 'custom' && !empty($date)) {
            $query->whereDate($dateColumn, $date);
        }

        $sales = $query->orderBy($dateColumn, 'desc')
            ->paginate(15)
            ->withQueryString();

        $trashedCount = $this->isOwner() ? Sale::onlyTrashed()->count() : 0;

        return Inertia::render('Sales/Index', [
            'sales'        => $sales,
            'isTrash'      => $trashed,
            'trashed'      => $trashed,
            'trashedCount' => $trashedCount,
            'canManage'    => $this->isOwner(),
            'filters'      => [
                'filter' => $filter,
                'date'   => $date,
            ],
        ]);
    }

    public function trash(Request $request)
    {
        $this->checkOwnerAccess();

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

        $trashedCount = Sale::onlyTrashed()->count();

        return Inertia::render('Sales/Index', [
            'sales'        => $sales,
            'isTrash'      => true,
            'trashed'      => true,
            'trashedCount' => $trashedCount,
            'canManage'    => true,
            'filters'      => [
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
            $inv = $sale->invoice_number;
            $sale->delete(); 

            if (class_exists(AuditLog::class)) {
                AuditLog::record('penjualan', 'DELETE', "Memindahkan transaksi penjualan No: {$inv} ke keranjang sampah.");
            }
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

            if (class_exists(AuditLog::class)) {
                AuditLog::record('penjualan', 'BULK_DELETE', 'Memindahkan ' . count($sales) . ' transaksi penjualan ke keranjang sampah.');
            }
        });

        return redirect()->back()->with('success', count($request->ids) . ' transaksi berhasil dipindahkan ke sampah.');
    }

    public function restore($id)
    {
        $this->checkOwnerAccess();

        try {
            DB::transaction(function () use ($id) {
                $sale = Sale::onlyTrashed()->findOrFail($id);
                $inv = $sale->invoice_number;
                $sale->restore();

                if (class_exists(AuditLog::class)) {
                    AuditLog::record('penjualan', 'RESTORE', "Memulihkan transaksi penjualan No: {$inv} dari keranjang sampah.");
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal memulihkan transaksi: ' . $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Transaksi berhasil dipulihkan.');
    }

    public function bulkRestore(Request $request)
    {
        $this->checkOwnerAccess();

        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:sales,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $sales = Sale::onlyTrashed()->whereIn('id', $request->ids)->get();
                foreach ($sales as $sale) {
                    $sale->restore();
                }

                if (class_exists(AuditLog::class)) {
                    AuditLog::record('penjualan', 'BULK_RESTORE', 'Memulihkan ' . count($sales) . ' transaksi penjualan dari keranjang sampah.');
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal memulihkan transaksi: ' . $e->getMessage()]);
        }

        return redirect()->back()->with('success', count($request->ids) . ' transaksi berhasil dipulihkan.');
    }

    public function forceDelete($id)
    {
        $this->checkOwnerAccess();

        DB::transaction(function () use ($id) {
            $sale = Sale::onlyTrashed()->findOrFail($id);
            $inv = $sale->invoice_number;
            $sale->forceDelete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record('penjualan', 'FORCE DELETE', "Menghapus PERMANEN transaksi penjualan No: {$inv} dari database.");
            }
        });

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus secara permanen.');
    }

    public function bulkForceDelete(Request $request)
    {
        $this->checkOwnerAccess();

        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        DB::beginTransaction();
        try {
            $sales = Sale::onlyTrashed()->whereIn('id', $request->ids)->get();
            $count = $sales->count();

            foreach ($sales as $sale) {
                $sale->forceDelete();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('penjualan', 'FORCE DELETE', "Menghapus PERMANEN {$count} transaksi penjualan dari database (bulk).");
            }

            DB::commit();
            return redirect()->back()->with('success', "{$count} transaksi penjualan berhasil dihapus secara permanen.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal hapus permanen massal: ' . $e->getMessage()]);
        }
    }
}