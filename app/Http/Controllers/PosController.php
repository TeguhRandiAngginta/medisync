<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Prescription;
use App\Services\GoogleAIService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $activeShift = \App\Models\CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

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
            'medicines' => $medicines,
            'activeShift' => $activeShift
        ]);
    }

    public function searchMedicines(Request $request)
    {
        $query = trim($request->get('q'));
        $today = now()->toDateString();

        $medicines = Medicine::where('is_active', true)
            ->when($query, function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('name', 'ilike', "%{$query}%")
                        ->orWhere('sku', 'ilike', "%{$query}%")
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

    public function smartSearch(Request $request)
    {
        $request->validate(['symptoms' => 'required|string']);
        
        $symptoms = trim($request->symptoms);
        $today = now()->toDateString();
        $keywords = [$symptoms];

        try {
            $prompt = "Pasien mengeluh: '{$symptoms}'. Berikan HANYA array JSON berisi maksimal 5 kata kunci (nama generik/kandungan/kategori) obat yang paling relevan untuk keluhan tersebut. Format wajib: [\"paracetamol\", \"ibuprofen\", \"sirup batuk\"]. Jangan berikan teks lain.";
            
            $aiResponse = \App\Services\GoogleAIService::generateContent($prompt);
            
            if (isset($aiResponse['raw_text'])) {
                $cleaned = preg_replace('/```json\s*|\s*```/', '', $aiResponse['raw_text']);
                $parsed = json_decode(trim($cleaned), true);
                if (is_array($parsed) && !empty($parsed)) {
                    $keywords = $parsed;
                }
            } elseif (is_array($aiResponse) && !empty($aiResponse)) {
                $keywords = $aiResponse;
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Smart Search AI fallback: " . $e->getMessage());
        }

        $medicines = Medicine::where('is_active', true)
            ->where(function ($q) use ($keywords, $symptoms) {
                foreach ($keywords as $keyword) {
                    $q->orWhere('name', 'ilike', "%{$keyword}%")
                        ->orWhere('generic_name', 'ilike', "%{$keyword}%")
                        ->orWhereHas('category', function ($catQuery) use ($keyword) {
                            $catQuery->where('name', 'ilike', "%{$keyword}%");
                        });
                }
                $q->orWhere('name', 'ilike', "%{$symptoms}%")
                    ->orWhere('generic_name', 'ilike', "%{$symptoms}%")
                    ->orWhereHas('category', function ($catQuery) use ($symptoms) {
                        $catQuery->where('name', 'ilike', "%{$symptoms}%");
                    });
            })
            ->withSum(['batches as real_stock' => function ($q) use ($today) {
                $q->where('stock_quantity', '>', 0)->where('expired_date', '>=', $today);
            }], 'stock_quantity')
            ->limit(15)
            ->get()
            ->map(function ($medicine) {
                $medicine->stock = (int) ($medicine->real_stock ?? 0);
                return $medicine;
            })
            ->values();

        return response()->json([
            'ai_analysis' => $keywords,
            'medicines' => $medicines
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.quantity' => 'required|integer|min:1',
            'cart.*.medicine_id' => 'nullable|integer',
            'cart.*.id' => 'nullable|integer',
            'paid_amount' => 'required_without:payments|nullable|numeric|min:0',
            'payments' => 'nullable|array',
            'payments.cash' => 'nullable|numeric|min:0',
            'payments.qris' => 'nullable|numeric|min:0',
            'payments.transfer' => 'nullable|numeric|min:0',
            'payment_method' => 'required_without:payments|nullable|string',
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

            // Harga SELALU diambil dari master obat, bukan dari request klien.
            $cartItems = collect($request->cart)->map(function ($item) {
                $item['resolved_id'] = (int) ($item['medicine_id'] ?? $item['id'] ?? 0);
                return $item;
            });
            $medicines = Medicine::where('is_active', true)
                ->whereIn('id', $cartItems->pluck('resolved_id')->unique())
                ->get()
                ->keyBy('id');

            foreach ($cartItems as $item) {
                if (!$medicines->has($item['resolved_id'])) {
                    throw new \Exception('Obat dalam keranjang tidak ditemukan atau sudah nonaktif.');
                }
            }

            $invoiceNumber = 'TRX-' . date('YmdHis') . '-' . random_int(1000, 9999);
            $totalAmount = $cartItems->sum(fn ($i) => $i['quantity'] * (float) $medicines[$i['resolved_id']]->selling_price);

            // Rincian pembayaran terstruktur (klien baru). Tanpa `payments` (klien lama) hanya
            // paid_amount + payment_method yang dipakai dan rincian dibiarkan NULL (transaksi lama).
            $breakdown = null;
            $paymentMethod = $request->payment_method;

            if (is_array($request->input('payments'))) {
                $methods = [
                    'Cash'     => round((float) $request->input('payments.cash', 0), 2),
                    'QRIS'     => round((float) $request->input('payments.qris', 0), 2),
                    'Transfer' => round((float) $request->input('payments.transfer', 0), 2),
                ];
                $paidAmount = round(array_sum($methods), 2);
            } else {
                $paidAmount = round((float) $request->paid_amount, 2);
            }

            if ($paidAmount < round($totalAmount, 2)) {
                throw new \Exception('Pembayaran kurang dari total belanja.');
            }
            $changeAmount = round($paidAmount - $totalAmount, 2);

            if (isset($methods)) {
                // Kembalian hanya bisa diberikan dari uang tunai yang diterima.
                if ($changeAmount > $methods['Cash']) {
                    throw new \Exception('Kembalian melebihi uang tunai yang diterima. Pembayaran non-tunai tidak boleh melebihi total belanja.');
                }

                $breakdown = [
                    'cash_amount'     => round($methods['Cash'] - $changeAmount, 2), // tunai bersih di laci
                    'qris_amount'     => $methods['QRIS'],
                    'transfer_amount' => $methods['Transfer'],
                ];

                $used = array_filter($methods, fn ($amount) => $amount > 0);
                $fmt = fn ($n) => rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.');
                $paymentMethod = count($used) > 1
                    ? implode(' + ', array_map(fn ($name, $amount) => "{$name}: " . $fmt($amount), array_keys($used), $used))
                    : (array_key_first($used) ?? 'Cash');
            }

            $activeShift = \App\Models\CashRegister::where('user_id', auth()->id())->where('status', 'open')->first();
            if (!$activeShift) {
                throw new \Exception('Gagal! Anda belum membuka shift kasir.');
            }

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => auth()->id(),
                'cash_register_id' => $activeShift->id,
                'total_amount' => $totalAmount,
                'subtotal_amount'  => $totalAmount,
                'paid_amount'    => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_method' => $paymentMethod,
                ...($breakdown ?? []),
                'sale_date' => now(),
            ]);

            foreach ($cartItems as $item) {
                $medicineId = $item['resolved_id'];
                $sellingPrice = (float) $medicines[$medicineId]->selling_price;
                $deduction = InventoryService::deductStockFEFO($medicineId, $item['quantity']);
                $unitHpp = is_array($deduction) ? ($deduction['unit_hpp'] ?? 0.0) : (float) $deduction;
                $batchNumber = is_array($deduction) ? ($deduction['batch_number'] ?? 'BATCH-AUTO') : 'BATCH-AUTO';

                $saleDetail = SaleDetail::create([
                    'sale_id'        => $sale->id,
                    'medicine_id'    => $medicineId,
                    'batch_number'   => $batchNumber,
                    'quantity'       => $item['quantity'],
                    'purchase_price' => $unitHpp,
                    'selling_price'  => $sellingPrice,
                    'subtotal'       => $item['quantity'] * $sellingPrice,
                ]);

                if (is_array($deduction) && !empty($deduction['batches'])) {
                    InventoryService::recordSaleDetailBatches($saleDetail->id, $deduction['batches']);
                }
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