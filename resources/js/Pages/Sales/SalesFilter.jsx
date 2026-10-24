import { Link } from '@inertiajs/react';

const Icons = {
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    TrashSolid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>,
    Restore: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    Print: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
    Back: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    Calendar: () => <svg className="w-4 h-4 text-[#48CFA4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Filter: () => <svg className="w-4 h-4 text-[#48CFA4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
};

export default function SalesFilter({ isTrash, selectedIds, filterType, setFilterType, customDate, setCustomDate, onBulkPrint, onBulkAction }) {
    return (
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    {isTrash ? 'Sampah Riwayat Penjualan (Trash)' : 'Daftar Transaksi Kasir'}
                </h3>
                <p className="text-sm text-gray-500">Kelola riwayat transaksi, filter tanggal, dan aksi massal.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* FILTER WAKTU & TANGGAL */}
                {!isTrash && (
                    <div className="flex items-center gap-2">
                        {/* Dropdown Preset Waktu */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#151E24] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <Icons.Filter />
                            <select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer pr-4"
                            >
                                <option value="all" className="bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-200">Semua Riwayat</option>
                                <option value="today" className="bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-200">Hari Ini</option>
                                <option value="yesterday" className="bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-200">Kemarin</option>
                                <option value="custom" className="bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-200">Pilih Tanggal Spesifik</option>
                            </select>
                        </div>

                        {/* Input Tanggal Khusus (Hanya muncul jika memilih 'custom') */}
                        {filterType === 'custom' && (
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#151E24] px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
                                <Icons.Calendar />
                                <input 
                                    type="date" 
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* TOMBOL AKSI MASSAL JIKA ADA ITEM DICENTANG */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedIds.length} Dipilih:</span>
                        
                        <button 
                            onClick={onBulkPrint}
                            className="px-3 py-1.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                            <Icons.Print /> Cetak Pilihan
                        </button>

                        {isTrash ? (
                            <>
                                <button 
                                    onClick={() => onBulkAction('restore')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                    <Icons.Restore /> Pulihkan
                                </button>
                                <button 
                                    onClick={() => onBulkAction('force-delete')}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                    <Icons.TrashSolid /> Hapus Permanen
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => onBulkAction('delete')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                                <Icons.Trash /> Hapus Pilihan
                            </button>
                        )}
                    </div>
                )}

                {isTrash ? (
                    <Link 
                        href={route('sales.history')} 
                        title="Kembali ke Riwayat"
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl transition-all flex items-center justify-center shadow-sm"
                    >
                        <Icons.Back />
                    </Link>
                ) : (
                    <Link 
                        href={route('sales.trash')} 
                        title="Lihat Sampah"
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-all flex items-center justify-center shadow-sm"
                    >
                        <Icons.Trash />
                    </Link>
                )}
            </div>
        </div>
    );
}