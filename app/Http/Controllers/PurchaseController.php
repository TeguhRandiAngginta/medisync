<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Medicine;
use App\Models\AuditLog;
use App\Models\ProductBatch;
use App\Services\GoogleAIService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    private function checkOwnerAccess()
    {
        $user = auth()->user();
        $roleSlug = $user->role->slug ?? '';

        if (!in_array($roleSlug, ['superadmin', 'owner'])) {
            abort(redirect()->back()->withErrors([
                'authorization' => 'Akses Ditolak: Hanya Owner atau Superadmin yang memiliki hak akses untuk mengubah data faktur pembelian.'
            ]));
        }
    }

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
            'suppliers'     => Supplier::where('is_active', true)->get(),
            'medicines'     => Medicine::select('id', 'name', 'sku', 'base_unit')->get(),
            'supplierTypes' => \App\Models\SupplierType::all(),
            'categories'    => \App\Models\MedicineCategory::where('is_active', true)->get(),
            'racks'         => \App\Models\Rack::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'internal_receipt_number' => 'required|string|unique:purchases,internal_receipt_number',
            'invoice_number' => 'required|string|unique:purchases,invoice_number',
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
            'invoice_number.unique' => 'Tindakan Ditolak: Nomor Faktur PBF ini sudah terdaftar atau masih berada di dalam Keranjang Sampah (Trash). Silakan gunakan nomor lain atau pulihkan faktur di menu Trash.'
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

    public function scanInvoice(Request $request)
    {
        $request->validate([
            'invoice_image' => 'required|string', 
            'mime_type' => 'required|string'
        ]);

        $prompt = 'Ekstrak data faktur obat ini. Kembalikan HANYA format JSON valid tanpa markdown seperti ini: {"invoice_number": "INV-123", "purchase_date": "YYYY-MM-DD", "items": [{"medicine_name": "Panadol", "quantity": 10, "uom": "Strip", "purchase_price": 5000, "batch_number": "B001", "expired_date": "YYYY-MM-DD"}]}';

        try {
            $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $request->invoice_image);
            $aiResponse = GoogleAIService::analyzePrescriptionImage($base64Image, $request->mime_type, $prompt);
            
            $result = $aiResponse;
            if (isset($aiResponse['raw_text'])) {
                $cleaned = preg_replace('/```json|```/', '', $aiResponse['raw_text']);
                $result = json_decode(trim($cleaned), true);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal membaca faktur: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Purchase $purchase)
    {
        $this->checkOwnerAccess();

        DB::beginTransaction();
        try {
            $purchase->load('details');
            $invoiceNumber = $purchase->invoice_number;
            
            foreach ($purchase->details as $detail) {
                ProductBatch::where('purchase_detail_id', $detail->id)->delete();
                InventoryService::syncMedicineStock($detail->medicine_id);
            }

            $purchase->delete();

            if (class_exists(AuditLog::class)) {
                AuditLog::record(
                    'pembelian', 
                    'DELETE', 
                    "Memindahkan faktur pembelian PBF No: {$invoiceNumber} ke keranjang sampah."
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
        $this->checkOwnerAccess();

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:purchases,id',
        ]);

        DB::beginTransaction();
        try {
            $purchases = Purchase::with('details')->whereIn('id', $validated['ids'])->get();
            $affectedMedicineIds = [];

            foreach ($purchases as $purchase) {
                foreach ($purchase->details as $detail) {
                    $affectedMedicineIds[] = $detail->medicine_id;
                    ProductBatch::where('purchase_detail_id', $detail->id)->delete();
                }
                $purchase->delete();
            }

            $uniqueMedicineIds = array_unique($affectedMedicineIds);
            foreach ($uniqueMedicineIds as $medicineId) {
                InventoryService::syncMedicineStock($medicineId);
            }

            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::record('pembelian', 'BULK_DELETE', 'Memindahkan ' . count($purchases) . ' faktur pembelian ke keranjang sampah.');
            }

            DB::commit();
            return redirect()->route('purchases.index')->with('success', count($purchases) . ' faktur pembelian berhasil dipindahkan ke keranjang sampah.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal menghapus massal: ' . $e->getMessage()]);
        }
    }

    public function restore($id)
    {
        $this->checkOwnerAccess();

        DB::beginTransaction();
        try {
            $purchase = Purchase::onlyTrashed()->with('details')->findOrFail($id);
            $purchase->restore();

            $affectedMedicineIds = [];

            foreach ($purchase->details as $detail) {
                $affectedMedicineIds[] = $detail->medicine_id;
                ProductBatch::onlyTrashed()
                    ->where('purchase_detail_id', $detail->id)
                    ->restore();
            }

            $uniqueMedicineIds = array_unique($affectedMedicineIds);
            foreach ($uniqueMedicineIds as $medicineId) {
                InventoryService::syncMedicineStock($medicineId);
            }

            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::record(
                    'pembelian', 
                    'RESTORE', 
                    "Memulihkan arsip faktur pembelian PBF No: {$purchase->invoice_number} dan batch stok obatnya dari keranjang sampah."
                );
            }

            DB::commit();
            return redirect()->route('purchases.trash')
                ->with('success', "Faktur {$purchase->invoice_number} berhasil dipulihkan, data POS dan Monitoring FEFO kembali normal!");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal memulihkan data: ' . $e->getMessage()]);
        }
    }

    public function forceDelete($id)
    {
        $this->checkOwnerAccess();

        DB::beginTransaction();
        try {
            $purchase = Purchase::onlyTrashed()->with('details')->findOrFail($id);
            $invoiceNumber = $purchase->invoice_number;

            foreach ($purchase->details as $detail) {
                ProductBatch::onlyTrashed()->where('purchase_detail_id', $detail->id)->forceDelete();
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