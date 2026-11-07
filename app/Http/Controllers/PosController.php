<?php

namespace App\Controllers; 

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Prescription;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        $medicines = Medicine::where('is_active', true)
            ->withSum(['batches as real_stock' => function ($query) use ($today) {
                $query->where('stock_quantity', '>', 0)
                    ->where('expired_date', '>=', $today);
            }], 'stock_quantity')
            ->get()
            ->map(function ($medicine) {
                $medicine->stock = (int) ($medicine->real_stock ?? 0);
                return $medicine;
            })
            ->values();

        return Inertia::render('Pos/Index', [
            'medicines' => $medicines
        ]);
    }

    public function searchMedicines(Request $request)
    {
        $query = $request->get('q');
        $today = now()->toDateString();

        $medicines = Medicine::where('is_active', true)
            ->when($query, function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('name', 'like', "%{$query}%")
                        ->orWhere('sku', 'like', "%{$query}%")
                        ->orWhere('barcode', $query);
                });
            })
            ->withSum(['batches as real_stock' => function ($q) use ($today) {
                $q->where('stock_quantity', '>', 0)->where('expired_date', '>=', $today);
            }], 'stock_quantity')
            ->limit(20) 
            ->get()
            ->map(function ($medicine) {
                $medicine->stock = (int) ($medicine->real_stock ?? 0);
                return $medicine;
            })
            ->values();

        return response()->json($medicines);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.quantity' => 'required|integer|min:1',
            'cart.*.price' => 'required|numeric',
            'paid_amount' => 'required|numeric',
            'change_amount' => 'required|numeric',
            'payment_method' => 'required|string',
            'prescription_id' => 'nullable|exists:prescriptions,id',
        ]);

        DB::beginTransaction();
        try {
            if ($request->filled('prescription_id')) {
                $prescription = Prescription::where('id', $request->prescription_id)
                    ->lockForUpdate()
                    ->first();

                if (!$prescription) {
                    throw new \Exception('Resep tidak ditemukan.');
                }

                if ($prescription->status !== 'DRAFT') {
                    throw new \Exception('Resep ini sudah pernah ditebus.');
                }

                $prescription->update(['status' => 'DISPENSED']);
            }

            $invoiceNumber = 'TRX-' . date('YmdHis') . '-' . rand(100, 999);
            $totalAmount = collect($request->cart)->sum(fn($i) => $i['quantity'] * $i['price']);

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => auth()->id(),
                'total_amount' => $totalAmount,
                'subtotal_amount'  => $totalAmount,
                'paid_amount'    => $request->paid_amount,
                'change_amount' => $request->change_amount,
                'payment_method' => $request->payment_method,
                'sale_date' => now(),
            ]);

            foreach ($request->cart as $item) {
                $medicineId = $item['medicine_id'] ?? $item['id'];
                $unitHpp = InventoryService::deductStockFEFO($medicineId, $item['quantity']);

                $activeBatch = \App\Models\ProductBatch::where('medicine_id', $medicineId)
                    ->where('stock_quantity', '>', 0)
                    ->orderBy('expired_date', 'asc')
                    ->first();

                SaleDetail::create([
                    'sale_id'        => $sale->id,
                    'medicine_id'    => $medicineId,
                    'batch_number'   => $activeBatch ? $activeBatch->batch_number : 'BATCH-AUTO',
                    'quantity'       => $item['quantity'],
                    'purchase_price' => $unitHpp,
                    'selling_price'  => $item['price'],
                    'subtotal'       => $item['quantity'] * $item['price'],
                ]);
            }

            DB::commit();

            return redirect()->back()->with([
                'success' => 'Transaksi kasir berhasil diproses!',
                'invoice_number' => $invoiceNumber
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memproses transaksi: ' . $e->getMessage()]);
        }
    }
}