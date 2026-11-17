<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Medicine;
use App\Models\StockAdjustment;
use App\Exports\ReportExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'monthly');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $medicineId = $request->get('medicine_id');

        if (!$startDate || !$endDate) {
            if ($period === 'daily') {
                $startDate = Carbon::today()->format('Y-m-d');
                $endDate = Carbon::today()->format('Y-m-d');
            } elseif ($period === 'weekly') {
                $startDate = Carbon::now()->startOfWeek()->format('Y-m-d');
                $endDate = Carbon::now()->endOfWeek()->format('Y-m-d');
            } elseif ($period === 'yearly') {
                $startDate = Carbon::now()->startOfYear()->format('Y-m-d');
                $endDate = Carbon::now()->endOfYear()->format('Y-m-d');
            } else {
                $startDate = Carbon::now()->startOfMonth()->format('Y-m-d');
                $endDate = Carbon::now()->endOfMonth()->format('Y-m-d');
            }
        }

        $rangeSales = fn () => Sale::whereBetween('sale_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        // Ringkasan dihitung dari seluruh periode (bukan hanya halaman yang tampil).
        $totalSales = (float) $rangeSales()->sum('total_amount');
        $totalTransactions = $rangeSales()->count();
        $totalHpp = 0.0;

        $rangeSales()->with('details.medicine')->chunkById(500, function ($chunk) use (&$totalHpp) {
            foreach ($chunk as $sale) {
                $totalHpp += $this->saleHpp($sale);
            }
        });

        // Daftar transaksi dipaginasi agar periode panjang (mis. tahunan) tidak memuat semuanya.
        $salesList = $rangeSales()->with('user')
            ->orderBy('sale_date', 'desc')
            ->orderByDesc('id')
            ->paginate(25, ['*'], 'sales_page')
            ->withQueryString();
        
        $profit = $totalSales - $totalHpp;

        $lowStockCount = Medicine::lowStock()->count();

        $stockMutations = $this->paginateArray(
            $this->generateStockLedger($medicineId, $startDate, $endDate),
            25,
            'ledger_page'
        );

        $calMonth = Carbon::parse($startDate)->month;
        $calYear = Carbon::parse($startDate)->year;

        $calendarData = Sale::selectRaw('DATE(sale_date) as date, COUNT(id) as transactions, SUM(total_amount) as revenue')
            ->whereMonth('sale_date', $calMonth)
            ->whereYear('sale_date', $calYear)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        // Rincian transaksi satu hari dimuat saat tanggal di kalender diklik (?day=Y-m-d), bukan satu bulan penuh.
        $daySales = [];
        $day = $request->query('day');
        if (is_string($day)) {
            $parsed = \DateTime::createFromFormat('Y-m-d', $day);
            if ($parsed && $parsed->format('Y-m-d') === $day) {
                $daySales = Sale::with('user')
                    ->whereBetween('sale_date', [$day . ' 00:00:00', $day . ' 23:59:59'])
                    ->orderByDesc('sale_date')->orderByDesc('id')
                    ->limit(200)
                    ->get();
            }
        }

        $medicinesList = Medicine::where('is_active', true)->select('id', 'name', 'sku', 'stock', 'base_unit')->get();

        return Inertia::render('Reports/Index', [
            'filters' => [
                'start_date'  => $startDate,
                'end_date'    => $endDate,
                'period'      => $period,
                'medicine_id' => $medicineId
            ],
            'summary' => [
                'total_sales'        => (float) $totalSales,
                'total_hpp'          => (float) $totalHpp,
                'profit'             => (float) $profit,
                'total_transactions' => $totalTransactions,
                'low_stock'          => $lowStockCount,
            ],
            'salesList'      => $salesList,
            'calendarData'   => $calendarData,
            'daySales'       => $daySales,
            'stockMutations' => $stockMutations,
            'medicinesList'  => $medicinesList,
            'calendarMonth'  => Carbon::parse($startDate)->format('Y-m-d')
        ]);
    }

    /** Paginasi untuk array hasil hitung (mis. kartu stok) dengan format sama seperti paginator Eloquent. */
    private function paginateArray(array $items, int $perPage, string $pageName): \Illuminate\Pagination\LengthAwarePaginator
    {
        $page = max(1, (int) request()->input($pageName, 1));

        return (new \Illuminate\Pagination\LengthAwarePaginator(
            array_slice($items, ($page - 1) * $perPage, $perPage),
            count($items),
            $perPage,
            $page,
            ['path' => request()->url(), 'pageName' => $pageName]
        ))->withQueryString();
    }

    /**
     * HPP satu transaksi = jumlah x HPP satuan riil yang tersimpan di sale_details
     * (cadangan: purchase_price obat bila ada). Dipakai layar dan export agar angkanya sama.
     */
    private function saleHpp(Sale $sale): float
    {
        $hpp = 0.0;
        foreach ($sale->details as $detail) {
            $unit = $detail->purchase_price > 0
                ? (float) $detail->purchase_price
                : (float) ($detail->medicine->purchase_price ?? 0);
            $hpp += $detail->quantity * $unit;
        }

        return $hpp;
    }

    /**
     * Kartu stok: pembelian (IN), penjualan (OUT), dan penyesuaian opname (IN/OUT) per obat,
     * lengkap dengan saldo sebelum/sesudah tiap mutasi.
     *
     * Saldo awal dihitung dari seluruh mutasi sebelum $startDate. Transaksi yang sudah dibatalkan
     * (penjualan/faktur/opname di trash) tidak dihitung, sama seperti stok batch yang dipulihkan.
     * Baris dikembalikan dari yang terbaru ke terlama; `balance` = saldo setelah mutasi itu.
     */
    private function generateStockLedger($medicineId, $startDate, $endDate)
    {
        $from = Carbon::parse($startDate)->startOfDay();
        $to   = Carbon::parse($endDate)->endOfDay();

        $rows = collect();

        $purchases = PurchaseDetail::with(['purchase.supplier'])
            ->whereHas('purchase', fn ($q) => $q->whereBetween('purchase_date', [$from->toDateString(), $to->toDateString()]))
            ->when($medicineId, fn ($q) => $q->where('medicine_id', $medicineId))
            ->get();

        foreach ($purchases as $item) {
            $rows->push([
                'at'          => Carbon::parse($item->purchase->purchase_date)->startOfDay(),
                'medicine_id' => $item->medicine_id,
                'type'        => 'IN',
                'reference'   => $item->purchase->invoice_number,
                'description' => 'Pembelian dari Supplier: ' . ($item->purchase->supplier->name ?? 'PBF'),
                'quantity'    => (int) $item->quantity,
                'uom'         => $item->uom ?? null,
            ]);
        }

        $sales = SaleDetail::with(['sale.user'])
            ->whereHas('sale', fn ($q) => $q->whereBetween('sale_date', [$from, $to]))
            ->when($medicineId, fn ($q) => $q->where('medicine_id', $medicineId))
            ->get();

        foreach ($sales as $item) {
            $rows->push([
                'at'          => Carbon::parse($item->sale->sale_date),
                'medicine_id' => $item->medicine_id,
                'type'        => 'OUT',
                'reference'   => $item->sale->invoice_number,
                'description' => 'Penjualan Kasir (Operator: ' . ($item->sale->user->name ?? 'Kasir') . ')',
                'quantity'    => (int) $item->quantity,
                'uom'         => null,
            ]);
        }

        $adjustments = StockAdjustment::with(['productBatch' => fn ($q) => $q->withTrashed()])
            ->whereBetween('created_at', [$from, $to])
            ->where('difference', '!=', 0)
            ->when($medicineId, fn ($q) => $q->where('medicine_id', $medicineId))
            ->get();

        foreach ($adjustments as $adj) {
            $rows->push([
                'at'          => Carbon::parse($adj->created_at),
                'medicine_id' => $adj->medicine_id,
                'type'        => $adj->difference > 0 ? 'IN' : 'OUT',
                'reference'   => 'OPN-' . str_pad((string) $adj->id, 5, '0', STR_PAD_LEFT),
                'description' => "Stock Opname {$adj->type} (Batch: " . ($adj->productBatch->batch_number ?? '-') . ", sistem {$adj->system_stock} → fisik {$adj->actual_stock})",
                'quantity'    => abs((int) $adj->difference),
                'uom'         => null,
            ]);
        }

        if ($rows->isEmpty()) {
            return [];
        }

        $medicineIds = $rows->pluck('medicine_id')->unique()->values();
        $medicines   = Medicine::withTrashed()->whereIn('id', $medicineIds)->get()->keyBy('id');
        $opening     = $this->openingBalances($medicineIds->all(), $from);

        $balances = [];
        $ledger = $rows
            ->map(function ($r, $i) { $r['seq'] = $i; return $r; })
            ->sortBy([['at', 'asc'], ['seq', 'asc']])
            ->map(function ($r) use ($medicines, $opening, &$balances) {
                $id = $r['medicine_id'];
                $before = $balances[$id] ?? ($opening[$id] ?? 0);
                $after  = $before + ($r['type'] === 'IN' ? $r['quantity'] : -$r['quantity']);
                $balances[$id] = $after;

                $medicine = $medicines->get($id);

                return [
                    'date'           => $r['at']->toIso8601String(),
                    'medicine_id'    => $id,
                    'medicine_name'  => $medicine->name ?? 'Obat',
                    'sku'            => $medicine->sku ?? '-',
                    'type'           => $r['type'],
                    'reference'      => $r['reference'],
                    'description'    => $r['description'],
                    'quantity'       => $r['quantity'],
                    'uom'            => $r['uom'] ?? ($medicine->base_unit ?? 'Tablet'),
                    'balance_before' => $before,
                    'balance'        => $after,
                ];
            });

        return $ledger->reverse()->values()->all();
    }

    /** Saldo awal per obat = pembelian - penjualan + selisih opname, seluruhnya sebelum $before. */
    private function openingBalances(array $medicineIds, Carbon $before): array
    {
        $bought = PurchaseDetail::whereIn('medicine_id', $medicineIds)
            ->whereHas('purchase', fn ($q) => $q->where('purchase_date', '<', $before->toDateString()))
            ->selectRaw('medicine_id, SUM(quantity) as qty')->groupBy('medicine_id')->pluck('qty', 'medicine_id');

        $sold = SaleDetail::whereIn('medicine_id', $medicineIds)
            ->whereHas('sale', fn ($q) => $q->where('sale_date', '<', $before))
            ->selectRaw('medicine_id, SUM(quantity) as qty')->groupBy('medicine_id')->pluck('qty', 'medicine_id');

        $adjusted = StockAdjustment::whereIn('medicine_id', $medicineIds)
            ->where('created_at', '<', $before)
            ->selectRaw('medicine_id, SUM(difference) as qty')->groupBy('medicine_id')->pluck('qty', 'medicine_id');

        $result = [];
        foreach ($medicineIds as $id) {
            $result[$id] = (int) ($bought[$id] ?? 0) - (int) ($sold[$id] ?? 0) + (int) ($adjusted[$id] ?? 0);
        }

        return $result;
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'sales');
        $format = $request->get('format', 'pdf');
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicineId = $request->get('medicine_id');

        $data = [];
        $title = '';

        if ($type === 'sales') {
            $title = 'Laporan Penjualan (Omzet & Struk)';
            $data = Sale::with(['user', 'details.medicine'])
                ->whereBetween('sale_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->orderBy('sale_date', 'desc')->get();
        } elseif ($type === 'purchase') {
            $title = 'Laporan Pembelian & Supplier';
            $data = Purchase::with(['user', 'supplier'])
                ->whereBetween('purchase_date', [$startDate, $endDate])
                ->orderBy('purchase_date', 'desc')->get();
        } elseif ($type === 'profit') {
            $title = 'Laporan Laba Rugi & HPP';
            $data = Sale::with(['details.medicine'])
                ->whereBetween('sale_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->orderBy('sale_date', 'desc')->get()
                ->each(fn ($sale) => $sale->hpp = $this->saleHpp($sale));
        } elseif ($type === 'stock') {
            $title = 'Laporan Stok Kritis';
            $data = Medicine::with('category')->lowStock()->orderBy('name')->get();
        } elseif ($type === 'mutations') {
            $title = 'Laporan Mutasi & Kartu Stok Obat';
            $data = $this->generateStockLedger($medicineId, $startDate, $endDate);
        }

        if ($format === 'excel') {
            $fileName = 'Laporan_' . strtoupper($type) . '_' . date('Ymd') . '.xlsx';
            return Excel::download(new ReportExport($type, $data, $startDate, $endDate, $title), $fileName);
        }

        return view('reports.print', compact('type', 'data', 'startDate', 'endDate', 'title'));
    }

    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', date('Y-m-01'));
        $endDate = $request->input('end_date', date('Y-m-t'));

        $sales = Sale::with('details')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->get();

        $totalRevenue = 0;
        $totalHPP = 0;

        foreach ($sales as $sale) {
            $totalRevenue += $sale->total_amount;
            foreach ($sale->details as $detail) {
                $hppUnit = $detail->purchase_price > 0 
                    ? $detail->purchase_price 
                    : ($detail->medicine->purchase_price ?? 0);

                $totalHPP += ($hppUnit * $detail->quantity);
            }
        }

        $grossProfit = $totalRevenue - $totalHPP;

        return Inertia::render('Reports/ProfitLoss', [
            'startDate'    => $startDate,
            'endDate'      => $endDate,
            'totalRevenue' => $totalRevenue,
            'totalHPP'     => $totalHPP,
            'grossProfit'  => $grossProfit,
            'profitMargin' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
        ]);
    }
}