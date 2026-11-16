import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function BatchCombobox({
    batches = [],
    selectedBatchId,
    baseUnit = 'Pcs',
    onSelect,
    error
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);

    // Selected batch object
    const selectedBatch = useMemo(() => {
        return batches.find((b) => String(b.id) === String(selectedBatchId)) || null;
    }, [batches, selectedBatchId]);

    // Filter batches by batch_number or expired_date
    const filteredBatches = useMemo(() => {
        if (!searchQuery.trim()) return batches;
        const q = searchQuery.toLowerCase();
        return batches.filter((b) =>
            (b.batch_number && b.batch_number.toLowerCase().includes(q)) ||
            (b.expired_date && b.expired_date.toLowerCase().includes(q))
        );
    }, [batches, searchQuery]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getExpiredStatus = (expiredDate) => {
        if (!expiredDate) return null;
        const today = new Date();
        const exp = new Date(expiredDate);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Kedaluwarsa
                </span>
            );
        } else if (diffDays <= 90) {
            return (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Kritis (&lt; 3 Bln)
                </span>
            );
        } else {
            return (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Aman
                </span>
            );
        }
    };

    const handleSelectBatch = (batch) => {
        onSelect(batch);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect(null);
        setSearchQuery('');
    };

    if (!batches || batches.length === 0) {
        return (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                    Obat ini belum memiliki catatan nomor batch aktif di sistem. Harap masukkan faktur pembelian terlebih dahulu untuk mencatat batch.
                </span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button / Display */}
            {selectedBatch ? (
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 hover:border-[#48CFA4] dark:hover:border-[#48CFA4] rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#253939] text-[#48CFA4] dark:text-[#67E2B4] flex items-center justify-center flex-shrink-0 font-mono font-bold text-xs">
                            #
                        </div>
                        <div className="truncate">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[#48CFA4] dark:text-[#67E2B4]">
                                    Batch: {selectedBatch.batch_number}
                                </span>
                                {getExpiredStatus(selectedBatch.expired_date)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span>Sisa Stok Sistem:</span>
                                <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                                    {selectedBatch.stock_quantity} {baseUnit}
                                </span>
                                <span>•</span>
                                <span className="font-mono">ED: {selectedBatch.expired_date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            title="Hapus pilihan batch"
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="p-1 text-gray-400">
                            <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 hover:border-[#48CFA4] dark:hover:border-[#48CFA4] rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 text-gray-400 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>-- Pilih Nomor Batch ({batches.length} batch tersedia) --</span>
                    </div>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            )}

            {/* Dropdown Options Menu */}
            {isOpen && (
                <div className="absolute z-40 mt-2 w-full bg-white dark:bg-[#151E24] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/80 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    {batches.length > 4 && (
                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Saring nomor batch atau tanggal..."
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#48CFA4]"
                            />
                        </div>
                    )}

                    <div className="px-3 py-2 bg-gray-50 dark:bg-[#1E272E] border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Urutan Batch Berdasarkan FEFO (Expired Terdekat)</span>
                        <span className="font-mono text-[10px]">{filteredBatches.length} Batch</span>
                    </div>

                    {filteredBatches.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs">
                            Tidak ada batch yang cocok dengan kata kunci "{searchQuery}".
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {filteredBatches.map((batch) => {
                                const isSelected = selectedBatch && String(selectedBatch.id) === String(batch.id);

                                return (
                                    <li
                                        key={batch.id}
                                        onClick={() => handleSelectBatch(batch)}
                                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                                            isSelected
                                                ? 'bg-[#EAF5F0] dark:bg-[#253939]/70 border-l-4 border-[#48CFA4]'
                                                : 'hover:bg-gray-50 dark:hover:bg-[#1E272E]'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-sm text-[#48CFA4] dark:text-[#67E2B4]">
                                                    {batch.batch_number}
                                                </span>
                                                {getExpiredStatus(batch.expired_date)}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                Kedaluwarsa: <span className="font-mono text-gray-600 dark:text-gray-300 font-medium">{batch.expired_date}</span>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 inline-block border border-gray-200 dark:border-gray-700/60">
                                                Stok: {batch.stock_quantity} {baseUnit}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {error && <p className="mt-1.5 text-xs text-rose-500 font-semibold">{error}</p>}
        </div>
    );
}
