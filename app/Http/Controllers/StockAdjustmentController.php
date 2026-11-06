<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\StockAdjustment;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index()
    {
        $adjustments = StockAdjustment::with(['medicine', 'productBatch', 'user'])
            ->latest()
            ->paginate(15);

        return Inertia::render('StockOpname/Index', [
            'adjustments' => $adjustments
        ]);
    }

    public function create()
    {
        $medicines = Medicine::with(['batches' => function ($q) {
            $q->orderBy('expiry_date', 'asc');
        }])->get();

        return Inertia::render('StockOpname/Create', [
            'medicines' => $medicines
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_batch_id' => 'required|exists:product_batches,id',
            'actual_stock' => 'required|integer|min:0',
            'type' => 'required|in:DAMAGE,EXPIRED,LOST,CORRECTION',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            InventoryService::adjustBatchStock(
                $request->product_batch_id,
                $request->actual_stock,
                $request->type,
                $request->notes
            );

            return redirect()->route('stock-adjustments.index')->with('success', 'Stock opname berhasil dicatat dan stok disesuaikan!');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Gagal memperbarui stok: ' . $e->getMessage()]);
        }
    }
}