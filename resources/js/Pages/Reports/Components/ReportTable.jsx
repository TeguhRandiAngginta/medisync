import React from 'react';

export default function ReportTable({ salesList, formatRupiah }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-[#151E24] text-gray-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Kasir</th>
                        <th className="px-6 py-4">Metode</th>
                        <th className="px-6 py-4">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {salesList && salesList.length > 0 ? salesList.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">{sale.sale_date}</td>
                            <td className="px-6 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{sale.invoice_number}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{sale.user?.name || '-'}</td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-extrabold uppercase">{sale.payment_method}</span>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white">{formatRupiah(sale.total_amount)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium">Tidak ada data transaksi pada periode ini.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}