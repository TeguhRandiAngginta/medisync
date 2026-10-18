<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Medicine;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index()
    {
        $purchases = Purchase::with(['supplier', 'user'])
            ->latest()
            ->get();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases
        ]);
    }

    public function create()
    {
        return Inertia::render('Purchases/Create', [
            'suppliers' => Supplier::where('is_active', true)->get(),
            'medicines' => Medicine::select('id', 'name', 'sku', 'base_unit')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'internal_receipt_number' => 'required|string|unique:purchases,internal_receipt_number',
            'invoice_number' => 'required|string',
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.batch_number' => 'required|string|max:100',
            'items.*.expired_date' => 'required|date|after:today',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.uom' => 'required|string|max:50',
            'items.*.purchase_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            foreach ($request->items as $item) {
                $totalAmount += ($item['quantity'] * $item['purchase_price']);
            }

            $purchase = Purchase::create([
                'internal_receipt_number' => $validated['internal_receipt_number'],
                'invoice_number' => strtoupper($validated['invoice_number']),
                'supplier_id' => $validated['supplier_id'],
                'user_id' => auth()->id(),
                'purchase_date' => $validated['purchase_date'],
                'total_amount' => $totalAmount,
                'status' => 'completed',
                'notes' => $validated['notes'],
            ]);

            foreach ($request->items as $item) {
                $purchase->details()->create([
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => strtoupper($item['batch_number']),
                    'expired_date' => $item['expired_date'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $item['purchase_price'],
                    'subtotal' => $item['quantity'] * $item['purchase_price'],
                ]);
            }

            // Menggunakan helper record dari model AuditLog
            AuditLog::record(
                'pembelian', 
                'CREATE', 
                "Mencatat faktur pembelian PBF No: {$purchase->invoice_number} dengan total Rp " . number_format($purchase->total_amount, 0, ',', '.')
            );

            DB::commit();

            return redirect()->route('purchases.index')
                ->with('success', "Faktur Pembelian {$purchase->invoice_number} berhasil disimpan.")
                ->with('print_url', route('purchases.print', $purchase->id));

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menyimpan transaksi: ' . $e->getMessage()]);
        }
    }

    public function printPdf(Purchase $purchase)
    {
        $purchase->load(['supplier', 'user', 'details.medicine']);

        $pdf = Pdf::loadView('pdf.purchase-receipt', compact('purchase'));
        
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('BPB-' . $purchase->internal_receipt_number . '.pdf', [
            'Content-Type' => 'application/pdf',
        ]);
    }

public function destroy(Purchase $purchase)
    {
        DB::beginTransaction();
        try {
            $purchase->load('details');
            $invoiceNumber = $purchase->invoice_number;

            AuditLog::record(
                'pembelian', 
                'DELETE', 
                "Menghapus faktur pembelian PBF No: {$invoiceNumber} senilai Rp " . number_format($purchase->total_amount, 0, ',', '.')
            );

            $purchase->details()->delete();
            $purchase->delete();

            DB::commit();

            return redirect()->route('purchases.index')
                ->with('success', "Faktur pembelian {$invoiceNumber} berhasil dihapus.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus pembelian: ' . $e->getMessage()]);
        }
    }
}