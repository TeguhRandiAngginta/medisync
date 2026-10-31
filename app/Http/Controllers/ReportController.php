<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Medicine;
use App\Exports\ReportExport;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'monthly'); // daily, weekly, monthly, yearly, custom
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

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
                $hpp = $detail->medicine->selling_price * 0.7;
                $totalHpp += ($detail->quantity * $hpp);
            }
        }
        $profit = $totalSales - $totalHpp;
        $lowStockCount = Medicine::whereColumn('current_stock', '<=', 'min_stock')->count();

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

        return Inertia::render('Reports/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'period' => $period
            ],
            'summary' => [
                'total_sales' => (float) $totalSales,
                'total_hpp' => (float) $totalHpp,
                'profit' => (float) $profit,
                'total_transactions' => $totalTransactions,
                'low_stock' => $lowStockCount,
            ],
            'salesList' => $salesList,
            'calendarData' => $calendarData,
            'monthSales' => $monthSales,
            'calendarMonth' => Carbon::parse($startDate)->format('Y-m-d')
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'sales'); // sales, purchase, profit, stock
        $format = $request->get('format', 'pdf'); // pdf, excel
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

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
            $data = Medicine::with(['category', 'supplier'])
                ->whereColumn('current_stock', '<=', 'min_stock')
                ->get();
        }

        // Eksekusi Download Excel
        if ($format === 'excel') {
            $fileName = 'Laporan_' . strtoupper($type) . '_' . date('Ymd') . '.xlsx';
            return Excel::download(new ReportExport($type, $data, $startDate, $endDate, $title), $fileName);
        }

        // Eksekusi View PDF / Print (Membuka Tab Blade)
        return view('reports.print', compact('type', 'data', 'startDate', 'endDate', 'title'));
    }
}