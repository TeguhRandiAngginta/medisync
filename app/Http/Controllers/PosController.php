<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
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
            ->select('id', 'sku', 'barcode', 'name', 'base_unit', 'selling_price')
            ->get()
            ->map(function ($medicine) {
                $medicine->stock = 50; 
                return $medicine;
            });

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
                SaleDetail::create([
                    'sale_id' => $sale->id,
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => 'AUTO-FEFO',
                    'quantity' => $item['quantity'],
                    'selling_price' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('pos', 'CREATE', "Transaksi kasir berhasil: {$invoiceNumber} via {$request->payment_method} senilai Rp" . number_format($subtotal, 0, ',', '.'));
            }

            DB::commit();

            return back()->with([
                'success' => "Transaksi berhasil! Nomor Struk: {$invoiceNumber}",
                'invoice_number' => $invoiceNumber
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memproses transaksi: ' . $e->getMessage()]);
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