const Icons = {
    Trash: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Restore: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    Print: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
    ),
};

export default function SalesTable({ sales, isTrash, selectedIds, onSelectAll, onSelectOne, onPrint, onDelete, onRestore, onForceDelete }) {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-[#151E24] text-gray-500 dark:text-gray-300 uppercase text-[11px] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                    <tr>
                        <th className="px-4 py-4 w-10 text-center">
                            <input
                                type="checkbox"
                                onChange={onSelectAll}
                                checked={sales?.length > 0 && selectedIds.length === sales.length}
                                className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E272E] text-[#48CFA4] focus:ring-[#48CFA4] cursor-pointer"
                            />
                        </th>
                        <th className="px-6 py-4 font-bold">No. Invoice</th>
                        <th className="px-6 py-4 font-bold">Waktu</th>
                        <th className="px-6 py-4 font-bold">Kasir</th>
                        <th className="px-6 py-4 font-bold">Metode Bayar</th>
                        <th className="px-6 py-4 font-bold">Total Tagihan</th>
                        {isTrash && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                        <th className="px-6 py-4 font-bold text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {!sales || sales.length === 0 ? (
                        <tr>
                            <td colSpan={isTrash ? 8 : 7} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                {isTrash ? 'Keranjang sampah penjualan kosong.' : 'Belum ada data transaksi.'}
                            </td>
                        </tr>
                    ) : (
                        sales.map((sale) => (
                            <tr
                                key={sale.id}
                                className={`hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors ${
                                    selectedIds.includes(sale.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                }`}
                            >
                                <td className="px-4 py-5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(sale.id)}
                                        onChange={() => onSelectOne(sale.id)}
                                        className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E272E] text-[#48CFA4] focus:ring-[#48CFA4] cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-5 font-mono font-bold text-[#48CFA4]">{sale.invoice_number}</td>
                                <td className="px-6 py-5 text-gray-600 dark:text-gray-300">{new Date(sale.sale_date).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-5 text-gray-800 dark:text-gray-200">{sale.user?.name || 'Admin'}</td>
                                <td className="px-6 py-5">
                                    <span className="px-2.5 py-1 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-full text-[11px] font-bold uppercase">
                                        {sale.payment_method}
                                    </span>
                                </td>
                                <td className="px-6 py-5 font-mono font-bold text-gray-800 dark:text-gray-200">{formatRupiah(sale.total_amount)}</td>
                                {isTrash && (
                                    <td className="px-6 py-5 text-center text-xs text-gray-400 font-mono">
                                        {sale.deleted_at ? new Date(sale.deleted_at).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                )}
                                <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onPrint(sale)}
                                            title="Cetak Struk"
                                            className="p-2 bg-gray-100 dark:bg-[#151E24] hover:bg-[#48CFA4] hover:text-white dark:hover:bg-[#48CFA4] dark:hover:text-white text-gray-600 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Icons.Print />
                                        </button>

                                        {isTrash ? (
                                            <>
                                                <button
                                                    onClick={() => onRestore(sale.id)}
                                                    title="Pulihkan Transaksi"
                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white dark:bg-blue-900/30 dark:text-blue-400 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <Icons.Restore />
                                                </button>
                                                <button
                                                    onClick={() => onForceDelete(sale.id)}
                                                    title="Hapus Permanen"
                                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <Icons.Trash />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => onDelete(sale.id)}
                                                title="Pindah ke Trash"
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}