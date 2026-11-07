<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Medicine;
use App\Models\AuditLog;
use App\Models\ProductBatch;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index()
    {
        $purchases = Purchase::with(['supplier', 'user', 'details.medicine' => function($q) {
            $q->withTrashed();
        }])
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
                $detail = $purchase->details()->create([
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => strtoupper($item['batch_number']),
                    'expired_date' => $item['expired_date'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $item['purchase_price'],
                    'subtotal' => $item['quantity'] * $item['purchase_price'],
                ]);

                ProductBatch::create([
                    'medicine_id' => $item['medicine_id'],
                    'purchase_detail_id' => $detail->id,
                    'batch_number' => strtoupper($item['batch_number']),
                    'stock_quantity' => $item['quantity'],
                    'expired_date' => $item['expired_date'],
                    'purchase_price' => $item['purchase_price'],
                ]);

                InventoryService::syncMedicineStock($item['medicine_id']);
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'pembelian', 
                    'CREATE', 
                    "Mencatat faktur pembelian PBF No: {$purchase->invoice_number} senilai Rp " . number_format($purchase->total_amount, 0, ',', '.')
                );
            }

            DB::commit();

            return redirect()->route('purchases.index')
                ->with('success', "Faktur Pembelian {$purchase->invoice_number} berhasil disimpan.")
                ->with('print_url', route('purchases.print', $purchase->id));

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menyimpan transaksi: ' . $e->getMessage()]);
        }
    }

    public function destroy(Purchase $purchase)
    {
        DB::beginTransaction();
        try {
            $purchase->load('details');
            $invoiceNumber = $purchase->invoice_number;
            
            foreach ($purchase->details as $detail) {
                // Hapus batch obat agar stok POS berkurang
                ProductBatch::where('purchase_detail_id', $detail->id)->delete();

                // Hitung ulang stok POS
                InventoryService::syncMedicineStock($detail->medicine_id);
            }

            // Hapus faktur (soft delete)
            $purchase->delete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'pembelian', 
                    'DELETE', 
                    "Menghapus faktur pembelian PBF No: {$invoiceNumber} senilai Rp " . number_format($purchase->total_amount, 0, ',', '.')
                );
            }

            DB::commit();

            return redirect()->route('purchases.index')
                ->with('success', "Faktur pembelian {$invoiceNumber} berhasil dipindahkan ke tong sampah.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus pembelian: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:purchases,id',
        ]);

        DB::beginTransaction();
        try {
            $purchases = Purchase::with('details')->whereIn('id', $validated['ids'])->get();

            foreach ($purchases as $purchase) {
                foreach ($purchase->details as $detail) {
                    ProductBatch::where('purchase_detail_id', $detail->id)->delete();
                    InventoryService::syncMedicineStock($detail->medicine_id);
                }
                $purchase->delete();
            }

            if (class_exists(AuditLog::class)) {
                AuditLog::record('pembelian', 'BULK_DELETE', 'Menghapus massal ' . count($purchases) . ' faktur pembelian.');
            }

            DB::commit();
            return redirect()->route('purchases.index')->with('success', count($purchases) . ' faktur pembelian berhasil dipindahkan ke tong sampah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus massal: ' . $e->getMessage()]);
        }
    }

    public function restore($id)
    {
        DB::beginTransaction();
        try {
            // Ambil data faktur beserta detail dari tong sampah
            $purchase = Purchase::onlyTrashed()->with('details.medicine')->findOrFail($id);
            
            // 1. Pulihkan Faktur Pembelian
            $purchase->restore();

            // 2. Rekonstruksi Batch & Sinkronisasi Stok
            foreach ($purchase->details as $detail) {
                // Cek apakah batch dengan obat dan nomor batch yang sama sudah ada
                $existingBatch = DB::table('product_batches')
                    ->where('medicine_id', $detail->medicine_id)
                    ->where('batch_number', $detail->batch_number)
                    ->first();

                if ($existingBatch) {
                    // Jika batch sudah ada, tambahkan kembali kuantitas stoknya
                    DB::table('product_batches')
                        ->where('id', $existingBatch->id)
                        ->update([
                            'stock_quantity' => $existingBatch->stock_quantity + $detail->quantity,
                            'updated_at'     => now(),
                        ]);
                } else {
                    // Jika batch tidak ada, buat baru (tanpa supplier_id yang tidak ada di tabel product_batches)
                    DB::table('product_batches')->insert([
                        'medicine_id'    => $detail->medicine_id,
                        'batch_number'   => $detail->batch_number,
                        'expired_date'   => $detail->expired_date,
                        'stock_quantity' => $detail->quantity,
                        'purchase_price' => $detail->purchase_price ?? $detail->price ?? 0,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }

                // 3. Sinkronisasi total stok pada tabel master obat agar muncul kembali di POS & Monitoring
                \App\Services\InventoryService::syncMedicineStock($detail->medicine_id);
            }

            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::record(
                    'pembelian', 
                    'RESTORE', 
                    "Memulihkan arsip faktur pembelian PBF No: {$purchase->invoice_number} dan merekonstruksi batch stok obat."
                );
            }

            DB::commit();
            return redirect()->route('purchases.trash')
                ->with('success', "Faktur {$purchase->invoice_number} berhasil dipulihkan dan seluruh stok batch obat telah kembali ke POS!");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan data: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::onlyTrashed()->with('details')->findOrFail($id);
            $invoiceNumber = $purchase->invoice_number;

            foreach ($purchase->details as $detail) {
                ProductBatch::where('purchase_detail_id', $detail->id)->delete();
                InventoryService::syncMedicineStock($detail->medicine_id);
            }

            $purchase->details()->delete();
            $purchase->forceDelete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'pembelian', 
                    'FORCE DELETE', 
                    "Menghapus PERMANEN faktur pembelian PBF No: {$invoiceNumber} dari database."
                );
            }

            DB::commit();
            return redirect()->route('purchases.trash')
                ->with('success', "Faktur pembelian {$invoiceNumber} berhasil dimusnahkan secara permanen.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus permanen data: ' . $e->getMessage()]);
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

    public function batchesIndex()
    {
        $batches = ProductBatch::with([
            'medicine' => function ($query) {
                $query->withTrashed();
            }, 
            'purchaseDetail.medicine' => function ($query) {
                $query->withTrashed();
            },
            'purchaseDetail.purchase.supplier'
        ])
        ->where('stock_quantity', '>', 0)
        ->orderBy('expired_date', 'asc')
        ->get()
        ->map(function ($batch) {
            if (!$batch->medicine || $batch->medicine->trashed()) {
                $fallbackMedicineName = $batch->purchaseDetail?->medicine?->name;
                if ($fallbackMedicineName) {
                    $batch->setRelation('medicine', new \App\Models\Medicine([
                        'name' => $fallbackMedicineName,
                        'sku'  => $batch->purchaseDetail?->medicine?->sku ?? 'SKU-LEGACY'
                    ]));
                }
            }
            return $batch;
        });

        return Inertia::render('Purchases/Batches', [
            'batches' => $batches
        ]);
    }
}