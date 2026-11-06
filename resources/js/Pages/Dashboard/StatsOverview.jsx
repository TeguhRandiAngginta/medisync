import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';

function useCountUp(endValue = 0, duration = 1000) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let startTimestamp = null;
        const target = Number(endValue) || 0;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setValue(Math.floor(progress * target));
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [endValue, duration]);
    return value;
}

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export default function StatsOverview({ stats }) {
    const animatedRevenue = useCountUp(stats?.todayRevenue || 0, 1200);
    const animatedTransactions = useCountUp(stats?.todayTransactions || 0, 1000);
    const animatedLowStock = useCountUp(stats?.lowStockCount || 0, 800);
    const animatedActiveMedicines = useCountUp(stats?.activeMedicines || 0, 1000);

    const expiringCount = stats?.expiringBatches?.length || 0;

    return (
        <div className="space-y-6">
            {/* KARTU RINGKASAN UTAMA */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Omzet Hari Ini</span>
                    <div className="text-2xl font-extrabold text-[#48CFA4] mb-1">
                        {formatRupiah(animatedRevenue)}
                    </div>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">↑ Real-time dari POS</span>
                </div>
                
                <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Transaksi</span>
                    <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">
                        {animatedTransactions} <span className="text-sm text-gray-500 font-medium">struk</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">Aktivitas Kasir Hari Ini</span>
                </div>

                <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Peringatan Stok</span>
                    <div className="text-2xl font-extrabold text-amber-500 mb-1">
                        {animatedLowStock} <span className="text-sm text-gray-500 font-medium">item</span>
                    </div>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">Sama / Di Bawah Batas Min</span>
                </div>

                <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kritis ED (&lt; 90 Hari)</span>
                    <div className="text-2xl font-extrabold text-rose-500 mb-1">
                        {expiringCount} <span className="text-sm text-gray-500 font-medium">batch</span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1">Perlu Pemantauan FEFO</span>
                </div>
            </div>

            {/* DAFTAR WIDGET PERINGATAN KRITIS (DIBAGI MENJADI 2 KOLOM SEIMBANG) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LIST WARNING ED */}
                <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                            Warning Kedaluwarsa (&lt; 90 Hari)
                        </h4>
                        <Link 
                            href={route('batches.index')} 
                            className="text-xs font-bold text-[#48CFA4] hover:underline"
                        >
                            Monitoring Batch
                        </Link>
                    </div>

                    {stats?.expiringBatches && stats.expiringBatches.length > 0 ? (
                        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                            {stats.expiringBatches.map((batch) => (
                                <div key={batch.id} className="flex justify-between items-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            {batch.medicine?.name || 'Obat'}
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            Batch: {batch.batch_number} | Sisa: {batch.stock_quantity}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${batch.days_left < 0 ? 'bg-red-600 text-white' : 'bg-rose-500 text-white'}`}>
                                        {batch.days_left < 0 ? 'EXPIRED' : `${batch.days_left} Hari Lagi`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center py-6 text-center text-xs text-gray-400 italic">
                            Tidak ada batch obat yang mendekati tanggal kedaluwarsa.
                        </div>
                    )}
                </div>

                {/* LIST WARNING STOK MENIPIS */}
                <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            Warning Stok Menipis
                        </h4>
                    </div>

                    {stats?.lowStockMedicines && stats.lowStockMedicines.length > 0 ? (
                        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                            {stats.lowStockMedicines.map((medicine) => (
                                <div key={medicine.id} className="flex justify-between items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            {medicine.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500">SKU: {medicine.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                            Sisa: {medicine.stock} {medicine.base_unit}
                                        </span>
                                        <p className="text-[10px] text-gray-400">Min: {medicine.min_stock}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center py-6 text-center text-xs text-gray-400 italic">
                            Semua stok obat dalam kondisi aman di atas batas minimum.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}