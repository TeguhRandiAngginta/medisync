<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\ProductBatch;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $medicines = Medicine::where('is_active', true)
            ->with(['batches' => function($query) {
                $query->where('stock_quantity', '>', 0);
            }])
            ->select('id', 'sku', 'barcode', 'name', 'base_unit', 'selling_price', 'stock')
            ->get()
            ->map(function ($medicine) {
                $realBatchStock = $medicine->batches->sum('stock_quantity');
                
                $medicine->stock = (int) $realBatchStock;
                $medicine->selling_price = (float) $medicine->selling_price;

                unset($medicine->batches);
                return $medicine;
            })
            ->values();

        return Inertia::render('Pos/Index', [
            'medicines' => $medicines
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.medicine_id' => 'required|exists:medicines,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'cart.*.price' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
        ]);

        $subtotal = collect($request->cart)->sum(function($item) {
            return $item['price'] * $item['quantity'];
        });

        DB::beginTransaction();
        try {
            foreach ($request->cart as $item) {
                $medicine = Medicine::where('id', $item['medicine_id'])->lockForUpdate()->first();
                
                if (!$medicine) {
                    throw new \Exception("Obat dengan ID {$item['medicine_id']} tidak ditemukan.");
                }

                $totalBatchStock = ProductBatch::where('product_id', $item['medicine_id'])
                    ->where('stock_quantity', '>', 0)
                    ->sum('stock_quantity');

                if ($totalBatchStock < $item['quantity']) {
                    throw new \Exception("Stok aktif untuk '{$medicine->name}' tidak mencukupi! Sisa stok tersedia: {$totalBatchStock} {$medicine->base_unit}. Silakan sesuaikan jumlah pembelian.");
                }
            }

            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(5));
            
            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => auth()->id(),
                'sale_date' => now(),
                'subtotal_amount' => $subtotal,
                'discount_amount' => 0,
                'total_amount' => $subtotal,
                'paid_amount' => $request->paid_amount ?? $subtotal,
                'change_amount' => $request->change_amount ?? 0,
                'payment_method' => $request->payment_method,
            ]);

            foreach ($request->cart as $item) {
                $quantityNeeded = $item['quantity'];

                $batches = ProductBatch::where('product_id', $item['medicine_id'])
                    ->where('stock_quantity', '>', 0)
                    ->orderBy('expired_date', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($batches as $batch) {
                    if ($quantityNeeded <= 0) break;

                    if ($batch->stock_quantity >= $quantityNeeded) {
                        $deductQty = $quantityNeeded;
                        $batch->decrement('stock_quantity', $deductQty);
                        $quantityNeeded = 0;
                    } else {
                        $deductQty = $batch->stock_quantity;
                        $batch->update(['stock_quantity' => 0]);
                        $quantityNeeded -= $deductQty;
                    }

                    SaleDetail::create([
                        'sale_id' => $sale->id,
                        'medicine_id' => $item['medicine_id'],
                        'batch_number' => $batch->batch_number,
                        'quantity' => $deductQty,
                        'selling_price' => $item['price'],
                        'subtotal' => $item['price'] * $deductQty,
                    ]);
                }

                $medicine = Medicine::find($item['medicine_id']);
                if ($medicine) {
                    $remainingStock = ProductBatch::where('product_id', $medicine->id)->sum('stock_quantity');
                    $medicine->update(['stock' => $remainingStock]);
                }
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('pos', 'CREATE', "Transaksi kasir berhasil dengan FEFO: {$invoiceNumber} via {$request->payment_method} senilai Rp" . number_format($subtotal, 0, ',', '.'));
            }

            DB::commit();

            return back()->with([
                'success' => "Transaksi berhasil! Nomor Struk: {$invoiceNumber}",
                'invoice_number' => $invoiceNumber
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function printReceipt($invoice)
    {
        $sale = Sale::with(['details.medicine', 'user'])->where('invoice_number', $invoice)->firstOrFail();

        return view('pos.receipt-pdf', [
            'sale' => $sale
        ]);
    }
}