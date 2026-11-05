import React from 'react';

export default function ReportStockLedger({ stockMutations = [] }) {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-gray-400 uppercase bg-gray-50/50 dark:bg-[#151E24]/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                        <th className="px-6 py-3.5">Waktu Transaksi</th>
                        <th className="px-6 py-3.5">Nama Obat & SKU</th>
                        <th className="px-6 py-3.5 text-center">Tipe Mutasi</th>
                        <th className="px-6 py-3.5 text-center">Jumlah</th>
                        <th className="px-6 py-3.5">No. Referensi / Struk</th>
                        <th className="px-6 py-3.5">Keterangan Sumber</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-800 dark:text-gray-200">
                    {stockMutations.length > 0 ? (
                        stockMutations.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {formatDate(item.date)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{item.medicine_name}</div>
                                    <div className="text-xs font-mono text-gray-400">{item.sku}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.type === 'IN' ? (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[11px] font-black rounded-lg inline-flex items-center gap-1">
                                            ↓ IN (Masuk)
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[11px] font-black rounded-lg inline-flex items-center gap-1">
                                            ↑ OUT (Keluar)
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold text-sm">
                                    <span className={item.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                        {item.type === 'IN' ? `+${item.quantity}` : `-${item.quantity}`}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-1 font-normal">{item.uom}</span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {item.reference}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                    {item.description}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm font-bold">
                                Belum ada riwayat mutasi stok pada periode ini.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}