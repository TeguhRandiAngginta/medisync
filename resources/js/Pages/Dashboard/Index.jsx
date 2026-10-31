import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import StatsOverview from './StatsOverview';
import SalesChart from './SalesChart';
import TopProductsChart from './TopProductsChart';
import RecentTransactions from './RecentTransactions';

export default function Index({ auth, stats, chartData, topProducts, paymentDistribution, recentTransactions, currentFilter }) {
    
    const handleFilterChange = (period) => {
        router.get(route('dashboard'), { period }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                            Halo, {auth.user.name}! Lihat performa apotek Anda.
                        </h2>
                        <p className="text-sm text-gray-500">Ringkasan transaksi dan inventaris real-time hari ini.</p>
                    </div>
                </div>

                <StatsOverview stats={stats} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SalesChart chartData={chartData} currentFilter={currentFilter} onFilterChange={handleFilterChange} />
                    <TopProductsChart topProducts={topProducts} />
                </div>

                <RecentTransactions recentTransactions={recentTransactions} paymentDistribution={paymentDistribution} />

            </div>
        </AuthenticatedLayout>
    );
}