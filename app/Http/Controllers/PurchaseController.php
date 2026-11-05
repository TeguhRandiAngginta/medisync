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
            'items.*.expired_date' => 'required|date|after_or_equal:' . now()->addMonths(6)->format('Y-m-d'),
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.uom' => 'required|string|max:50',
            'items.*.purchase_price' => 'required|numeric|min:0',
        ], [
            'internal_receipt_number.required' => 'Nomor penerimaan internal wajib ada.',
            'internal_receipt_number.unique' => 'Nomor penerimaan internal ini sudah terdaftar di sistem.',
            'invoice_number.required' => 'Nomor faktur PBF asli wajib diisi.',
            'supplier_id.required' => 'Silakan pilih supplier PBF terlebih dahulu.',
            'supplier_id.exists' => 'Supplier yang dipilih tidak valid.',
            'purchase_date.required' => 'Tanggal faktur wajib diisi.',
            'items.required' => 'Minimal harus ada 1 item obat yang dimasukkan.',
            'items.*.medicine_id.required' => 'Pilih obat master terlebih dahulu.',
            'items.*.medicine_id.exists' => 'Data obat master tidak ditemukan.',
            'items.*.batch_number.required' => 'Nomor batch pabrik wajib diisi.',
            'items.*.expired_date.required' => 'Tanggal kadaluarsa wajib diisi.',
            'items.*.expired_date.after_or_equal' => 'Masa berlaku (expired date) obat terlalu dekat! Standar apotek minimal 6 bulan ke depan dari hari ini.',
            'items.*.quantity.required' => 'Jumlah kuantitas obat wajib diisi.',
            'items.*.quantity.min' => 'Jumlah kuantitas minimal adalah 1.',
            'items.*.purchase_price.required' => 'Harga beli wajib diisi.',
            'items.*.purchase_price.min' => 'Harga beli tidak boleh bernilai negatif.',
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

                // Otomatis tambah stok obat di master produk
                $medicine = Medicine::find($item['medicine_id']);
                if ($medicine) {
                    $medicine->increment('stock', $item['quantity']);
                }
            }

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
            
            foreach ($purchase->details as $detail) {
                $medicine = Medicine::find($detail->medicine_id);
                if ($medicine) {
                    // Pastikan stok tidak minus menggunakan operator minus (-) yang benar
                    $newStock = max(0, $medicine->stock - $detail->quantity);
                    $medicine->update(['stock' => $newStock]);
                }
            }

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

    public function trash()
    {
        $trashedPurchases = Purchase::onlyTrashed()
            ->with(['supplier', 'user'])
            ->latest()
            ->get();

        return Inertia::render('Purchases/Trash', [
            'purchases' => $trashedPurchases
        ]);
    }

    public function restore($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::onlyTrashed()->findOrFail($id);
            
            $purchase->restore();
            $purchase->details()->restore();

            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::record(
                    'pembelian', 
                    'RESTORE', 
                    "Memulihkan data faktur pembelian PBF No: {$purchase->invoice_number} dari tong sampah."
                );
            }

            DB::commit();
            return redirect()->route('purchases.trash')
                ->with('success', "Faktur pembelian {$purchase->invoice_number} berhasil dipulihkan.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan data: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::onlyTrashed()->findOrFail($id);
            $invoiceNumber = $purchase->invoice_number;

            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::record(
                    'pembelian', 
                    'FORCE DELETE', 
                    "Menghapus PERMANEN faktur pembelian PBF No: {$invoiceNumber} dari database."
                );
            }

            $purchase->details()->forceDelete();
            $purchase->forceDelete();

            DB::commit();
            return redirect()->route('purchases.trash')
                ->with('success', "Faktur pembelian {$invoiceNumber} berhasil dimusnahkan secara permanen.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus permanen data: ' . $e->getMessage()]);
        }
    }
}