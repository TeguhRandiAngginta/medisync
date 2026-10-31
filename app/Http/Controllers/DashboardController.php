<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Sale;
use App\Models\Medicine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->get('period', 'daily');

        $today = Carbon::today();
        
        $todayRevenue = Sale::whereDate('sale_date', $today)->sum('total_amount');
        $todayTransactions = Sale::whereDate('sale_date', $today)->count();
        
        $lowStockCount = Medicine::whereColumn('current_stock', '<=', 'min_stock')->count();
        $activeMedicines = Medicine::where('is_active', true)->count();
        
        $chartData = [];
        if ($filter == 'weekly') {
            for ($i = 3; $i >= 0; $i--) {
                $start = Carbon::now()->subWeeks($i)->startOfWeek();
                $end = Carbon::now()->subWeeks($i)->endOfWeek();
                $total = Sale::whereBetween('sale_date', [$start, $end])->sum('total_amount');
                $chartData[] = [
                    'name' => 'Minggu ' . (4 - $i), 
                    'total' => (float) $total
                ];
            }
        } elseif ($filter == 'monthly') {
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $total = Sale::whereYear('sale_date', $month->year)
                            ->whereMonth('sale_date', $month->month)
                            ->sum('total_amount');
                $chartData[] = [
                    'name' => $month->locale('id')->isoFormat('MMM YYYY'),
                    'total' => (float) $total
                ];
            }
        } elseif ($filter == 'yearly') {
            for ($i = 2; $i >= 0; $i--) {
                $year = Carbon::now()->subYears($i)->year;
                $total = Sale::whereYear('sale_date', $year)->sum('total_amount');
                $chartData[] = [
                    'name' => (string) $year,
                    'total' => (float) $total
                ];
            }
        } else {
            $last7Days = Sale::select(DB::raw('DATE(sale_date) as date'), DB::raw('SUM(total_amount) as total'))
                ->where('sale_date', '>=', Carbon::now()->subDays(6)->startOfDay())
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            for ($i = 6; $i >= 0; $i--) {
                $dateStr = Carbon::now()->subDays($i)->format('Y-m-d');
                $match = $last7Days->firstWhere('date', $dateStr);
                $chartData[] = [
                    'name' => Carbon::now()->subDays($i)->locale('id')->isoFormat('ddd'),
                    'total' => $match ? (float) $match->total : 0
                ];
            }
        }

        $topProducts = DB::table('sale_details')
            ->join('sales', 'sale_details.sale_id', '=', 'sales.id')
            ->join('medicines', 'sale_details.medicine_id', '=', 'medicines.id')
            ->select('medicines.name', DB::raw('SUM(sale_details.quantity) as value'))
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('value')
            ->limit(4)
            ->get();

        $totalCompleted = Sale::count();
        $paymentStats = DB::table('sales')
            ->select('payment_method', DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        $paymentDistribution = $paymentStats->map(function ($item) use ($totalCompleted) {
            return [
                'method' => strtoupper($item->payment_method),
                'count' => $item->count,
                'percentage' => $totalCompleted > 0 ? round(($item->count / $totalCompleted) * 100) : 0
            ];
        })->keyBy('method');

        $recentTransactions = Sale::with('user')
            ->orderBy('sale_date', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'todayRevenue' => (float) $todayRevenue,
                'todayTransactions' => $todayTransactions,
                'lowStockCount' => $lowStockCount,
                'activeMedicines' => $activeMedicines,
            ],
            'chartData' => $chartData,
            'topProducts' => $topProducts,
            'paymentDistribution' => $paymentDistribution,
            'recentTransactions' => $recentTransactions,
            'currentFilter' => $filter,
        ]);
    }
}