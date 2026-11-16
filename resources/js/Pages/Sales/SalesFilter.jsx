const Icons = {
    Calendar: () => (
        <svg className="w-4 h-4 text-[#48CFA4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Filter: () => (
        <svg className="w-4 h-4 text-[#48CFA4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
};

export default function SalesFilter({ filterType, setFilterType, customDate, setCustomDate }) {
    return (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter Periode Transaksi</span>

            <div className="flex flex-wrap items-center gap-2">
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
        </div>
    );
}