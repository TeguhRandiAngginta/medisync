<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Medicine;
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

        $salesQuery = Sale::with(['user', 'details.medicine'])
            ->whereBetween('sale_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('sale_date', 'desc');
            
        $salesList = $salesQuery->get();

        $totalSales = $salesList->sum('total_amount');
        $totalTransactions = $salesList->count();
        $totalHpp = 0;

        foreach ($salesList as $sale) {
            foreach ($sale->details as $detail) {
                // Mengambil purchase_price riil dari sale_details
                $hppUnit = $detail->purchase_price > 0 
                    ? $detail->purchase_price 
                    : ($detail->medicine->purchase_price ?? 0);
                    
                $totalHpp += ($detail->quantity * $hppUnit);
            }
        }
        
        $profit = $totalSales - $totalHpp;

        $lowStockCount = Medicine::where('stock', '<=', 10)->count();

        $stockMutations = $this->generateStockLedger($medicineId, $startDate, $endDate);

        $calMonth = Carbon::parse($startDate)->month;
        $calYear = Carbon::parse($startDate)->year;

        $calendarData = Sale::selectRaw('DATE(sale_date) as date, COUNT(id) as transactions, SUM(total_amount) as revenue')
            ->whereMonth('sale_date', $calMonth)
            ->whereYear('sale_date', $calYear)
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $monthSales = Sale::with('user')
            ->whereMonth('sale_date', $calMonth)
            ->whereYear('sale_date', $calYear)
            ->orderBy('sale_date', 'desc')
            ->get();

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
            'monthSales'     => $monthSales,
            'stockMutations' => $stockMutations,
            'medicinesList'  => $medicinesList,
            'calendarMonth'  => Carbon::parse($startDate)->format('Y-m-d')
        ]);
    }

    private function generateStockLedger($medicineId = null, $startDate, $endDate)
    {
        $purchasesQuery = PurchaseDetail::with(['purchase.supplier', 'medicine'])
            ->whereHas('purchase', function($q) use ($startDate, $endDate) {
                $q->whereBetween('purchase_date', [$startDate, $endDate]);
            });

        if ($medicineId) {
            $purchasesQuery->where('medicine_id', $medicineId);
        }

        $purchases = $purchasesQuery->get()->map(function($item) {
            return [
                'date'          => $item->purchase->purchase_date,
                'medicine_id'   => $item->medicine_id,
                'medicine_name' => $item->medicine->name ?? 'Obat',
                'sku'           => $item->medicine->sku ?? '-',
                'type'          => 'IN',
                'reference'     => $item->purchase->invoice_number,
                'description'   => 'Pembelian dari Supplier: ' . ($item->purchase->supplier->name ?? 'PBF'),
                'quantity'      => (int) $item->quantity,
                'uom'           => $item->uom ?? 'Tablet',
            ];
        });

        $salesQuery = SaleDetail::with(['sale.user', 'medicine'])
            ->whereHas('sale', function($q) use ($startDate, $endDate) {
                $q->whereBetween('sale_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            });

        if ($medicineId) {
            $salesQuery->where('medicine_id', $medicineId);
        }

        $sales = $salesQuery->get()->map(function($item) {
            return [
                'date'          => $item->sale->sale_date,
                'medicine_id'   => $item->medicine_id,
                'medicine_name' => $item->medicine->name ?? 'Obat',
                'sku'           => $item->medicine->sku ?? '-',
                'type'          => 'OUT',
                'reference'     => $item->sale->invoice_number,
                'description'   => 'Penjualan Kasir (Operator: ' . ($item->sale->user->name ?? 'Kasir') . ')',
                'quantity'      => (int) $item->quantity,
                'uom'           => $item->medicine->base_unit ?? 'Tablet',
            ];
        });

        return $purchases->concat($sales)->sortByDesc('date')->values()->all();
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
                ->orderBy('sale_date', 'desc')->get();
        } elseif ($type === 'stock') {
            $title = 'Laporan Stok Kritis';
            $data = Medicine::where('stock', '<=', 10)->get();
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