import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function StockOpnameIndex({ adjustments }) {
    const getTypeBadge = (type) => {
        switch (type) {
            case 'DAMAGE':
                return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Kerusakan Fisik</span>;
            case 'EXPIRED':
                return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Kedaluwarsa</span>;
            case 'LOST':
                return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Selisih Hilang</span>;
            case 'CORRECTION':
            default:
                return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Koreksi Opname</span>;
        }
    };

    const getDiffBadge = (difference) => {
        if (difference > 0) {
            return <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{difference}</span>;
        } else if (difference < 0) {
            return <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{difference}</span>;
        }
        return <span className="font-mono font-bold text-gray-500 dark:text-gray-400">0</span>;
    };

    return (
        <AuthenticatedLayout header="Stock Opname & Penyesuaian">
            <Head title="Stock Opname" />

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Riwayat Stock Opname</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Catatan penyesuaian fisik stok obat dan koreksi selisih batch gudang.</p>
                </div>
                <Link
                    href={route('stock-adjustments.create')}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-[#48CFA4] hover:bg-[#3bb890] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#48CFA4]/20 transition-all gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Catat Stock Opname
                </Link>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Tanggal</th>
                            <th className="px-6 py-4 font-bold">Nama Obat & SKU</th>
                            <th className="px-6 py-4 font-bold">Nomor Batch</th>
                            <th className="px-6 py-4 font-bold text-center">Tipe</th>
                            <th className="px-6 py-4 font-bold text-right">Stok Sistem</th>
                            <th className="px-6 py-4 font-bold text-right">Stok Fisik</th>
                            <th className="px-6 py-4 font-bold text-right">Selisih</th>
                            <th className="px-6 py-4 font-bold">Petugas</th>
                            <th className="px-6 py-4 font-bold">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {(!adjustments?.data || adjustments.data.length === 0) ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center text-gray-400 dark:text-gray-500 font-medium">
                                    Belum ada catatan stock opname yang dibuat.
                                </td>
                            </tr>
                        ) : (
                            adjustments.data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 dark:text-gray-100">{item.medicine?.name || '-'}</div>
                                        <div className="text-xs text-gray-400 font-mono">{item.medicine?.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-[#48CFA4]">
                                        {item.product_batch?.batch_number || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getTypeBadge(item.type)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">
                                        {item.system_stock}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 dark:text-gray-100">
                                        {item.actual_stock}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {getDiffBadge(item.difference)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                        {item.user?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {item.notes || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {adjustments?.links && adjustments.links.length > 3 && (
                <div className="mt-6 flex justify-center gap-1">
                    {adjustments.links.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.url || '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3.5 py-2 text-xs rounded-xl font-bold transition-all ${
                                link.active
                                    ? 'bg-[#48CFA4] text-white shadow-sm'
                                    : link.url
                                    ? 'bg-white dark:bg-[#1E272E] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                                    : 'opacity-40 cursor-not-allowed text-gray-400'
                            }`}
                        />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
