import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Batches({ batches }) {
    const getExpiredStatus = (expiredDate) => {
        const today = new Date();
        const exp = new Date(expiredDate);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold uppercase">Sudah Kedaluwarsa</span>;
        } else if (diffDays <= 90) { // Kurang dari 3 bulan
            return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg text-xs font-bold uppercase">Kritis (&lt; 3 Bulan)</span>;
        } else {
            return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-bold uppercase">Aman</span>;
        }
    };

    return (
        <AuthenticatedLayout header="Monitoring Batch & Kedaluwarsa (FEFO)">
            <Head title="Monitoring FEFO" />

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Stok Batch Aktif</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sistem otomatis memprioritaskan pengeluaran obat berdasarkan tanggal kedaluwarsa terdekat.</p>
                </div>
                <Link 
                    href={route('purchases.index')}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors text-center"
                >
                    &larr; Kembali ke Faktur Pembelian
                </Link>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Nama Obat (SKU)</th>
                            <th className="px-6 py-4 font-bold">Nomor Batch</th>
                            <th className="px-6 py-4 font-bold">Supplier / PBF</th>
                            <th className="px-6 py-4 font-bold">Sisa Stok Batch</th>
                            <th className="px-6 py-4 font-bold">Tanggal Kedaluwarsa (ED)</th>
                            <th className="px-6 py-4 font-bold text-center">Status FEFO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {!batches || batches.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-bold">Belum ada data stok batch aktif di gudang.</td>
                            </tr>
                        ) : (
                            batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5">
                                        {/* Diubah dari batch.product menjadi batch.medicine */}
                                        <div className="font-bold text-gray-800 dark:text-gray-100">{batch.medicine?.name || 'Nama Obat Tidak Tersedia'}</div>
                                        <div className="text-xs text-gray-400 font-mono">{batch.medicine?.sku}</div>
                                    </td>
                                    <td className="px-6 py-5 font-mono font-bold text-[#48CFA4]">{batch.batch_number}</td>
                                    <td className="px-6 py-5 text-gray-600 dark:text-gray-300 font-medium">
                                        {batch.purchase_detail?.purchase?.supplier?.name || 'Pembelian Langsung'}
                                    </td>
                                    <td className="px-6 py-5 font-mono font-bold text-gray-800 dark:text-gray-200">
                                        {batch.stock_quantity} <span className="text-xs font-normal text-gray-400">{batch.medicine?.base_unit}</span>
                                    </td>
                                    <td className="px-6 py-5 font-mono text-gray-700 dark:text-gray-300 font-bold">{batch.expired_date}</td>
                                    <td className="px-6 py-5 text-center">
                                        {getExpiredStatus(batch.expired_date)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}