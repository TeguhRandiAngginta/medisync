const Icons = {
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    TrashSolid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>,
    Restore: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    Print: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
};

export default function SalesTable({ sales, isTrash, selectedIds, onSelectAll, onSelectOne, onPrint, onDelete, onRestore, onForceDelete }) {
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-[#151E24] text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <input 
                                type="checkbox" 
                                onChange={onSelectAll}
                                checked={sales?.length > 0 && selectedIds.length === sales.length}
                                className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] w-4 h-4 cursor-pointer"
                            />
                        </th>
                        <th className="px-6 py-4">No. Invoice</th>
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Kasir</th>
                        <th className="px-6 py-4">Metode Bayar</th>
                        <th className="px-6 py-4">Total Tagihan</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {!sales || sales.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-6 py-10 text-center text-gray-400">Belum ada data transaksi.</td>
                        </tr>
                    ) : (
                        sales.map((sale) => (
                            <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-[#151E24] ${selectedIds.includes(sale.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(sale.id)}
                                        onChange={() => onSelectOne(sale.id)}
                                        className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-[#48CFA4]">{sale.invoice_number}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(sale.sale_date).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{sale.user?.name || 'Admin'}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase">{sale.payment_method}</span>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{formatRupiah(sale.total_amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button 
                                            onClick={() => onPrint(sale)}
                                            title="Cetak Struk"
                                            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-[#48CFA4] hover:text-white text-gray-600 dark:text-gray-300 rounded-xl transition-all"
                                        >
                                            <Icons.Print />
                                        </button>

                                        {isTrash ? (
                                            <>
                                                <button 
                                                    onClick={() => onRestore(sale.id)}
                                                    title="Pulihkan Transaksi"
                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl transition-all"
                                                >
                                                    <Icons.Restore />
                                                </button>
                                                <button 
                                                    onClick={() => onForceDelete(sale.id)}
                                                    title="Hapus Permanen"
                                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-xl transition-all"
                                                >
                                                    <Icons.TrashSolid />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => onDelete(sale.id)}
                                                title="Hapus / Masukkan ke Sampah"
                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-xl transition-all"
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