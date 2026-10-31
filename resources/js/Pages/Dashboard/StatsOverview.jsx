import { useState, useEffect } from 'react';

function useCountUp(endValue, duration = 1000) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setValue(Math.floor(progress * endValue));
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [endValue, duration]);
    return value;
}

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function StatsOverview({ stats }) {
    const animatedRevenue = useCountUp(stats.todayRevenue, 1200);
    const animatedTransactions = useCountUp(stats.todayTransactions, 1000);
    const animatedLowStock = useCountUp(stats.lowStockCount, 800);
    const animatedActiveMedicines = useCountUp(stats.activeMedicines, 1000);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Omzet Hari Ini</span>
                <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">
                    {formatRupiah(animatedRevenue)}
                </div>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">↑ Real-time dari POS</span>
            </div>
            
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Transaksi</span>
                <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">
                    {animatedTransactions} <span className="text-sm text-gray-500 font-medium">struk</span>
                </div>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">Aktivitas Kasir</span>
            </div>

            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Peringatan Stok</span>
                <div className="text-2xl font-extrabold text-red-500 mb-1">
                    {animatedLowStock} <span className="text-sm text-gray-500 font-medium">item</span>
                </div>
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">Menipis / Kritis</span>
            </div>

            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Katalog Obat Aktif</span>
                <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">
                    {animatedActiveMedicines} <span className="text-sm text-gray-500 font-medium">SKU</span>
                </div>
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">Data Master</span>
            </div>
        </div>
    );
}