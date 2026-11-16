import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function MedicineCombobox({
    medicines = [],
    selectedMedicineId,
    onSelect,
    error
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Selected medicine object
    const selectedMedicine = useMemo(() => {
        return medicines.find((m) => String(m.id) === String(selectedMedicineId)) || null;
    }, [medicines, selectedMedicineId]);

    // Filter medicines
    const filteredMedicines = useMemo(() => {
        if (!searchQuery.trim()) return medicines;
        const q = searchQuery.toLowerCase();
        return medicines.filter((m) =>
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.sku && m.sku.toLowerCase().includes(q)) ||
            (m.generic_name && m.generic_name.toLowerCase().includes(q))
        );
    }, [medicines, searchQuery]);

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

    // Autofocus search input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelectMedicine = (med) => {
        onSelect(med);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect(null);
        setSearchQuery('');
    };

    const getTotalStock = (med) => {
        if (!med.batches || med.batches.length === 0) return 0;
        return med.batches.reduce((sum, b) => sum + (parseInt(b.stock_quantity, 10) || 0), 0);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button / Display */}
            {!isOpen && selectedMedicine ? (
                <div
                    onClick={() => setIsOpen(true)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 hover:border-[#48CFA4] dark:hover:border-[#48CFA4] rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div className="truncate">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                                    {selectedMedicine.name}
                                </span>
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold flex-shrink-0">
                                    {selectedMedicine.sku}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                {selectedMedicine.generic_name && (
                                    <span className="italic truncate">{selectedMedicine.generic_name} •</span>
                                )}
                                <span>{selectedMedicine.batches?.length || 0} Batch Tercatat</span>
                                <span>•</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    Stok Total: {getTotalStock(selectedMedicine)} {selectedMedicine.base_unit}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            title="Hapus pilihan obat"
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="p-1 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </div>
                    </div>
                </div>
            ) : (
                /* Search / Trigger input */
                <div className="relative">
                    <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            placeholder={selectedMedicine ? selectedMedicine.name : "Ketik nama obat, SKU, atau zat aktif..."}
                            className="w-full pl-10 pr-10 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 transition-all outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Dropdown Options Menu */}
            {isOpen && (
                <div className="absolute z-40 mt-2 w-full bg-white dark:bg-[#151E24] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/80 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-[#1E272E] border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Daftar Katalog Obat ({filteredMedicines.length})</span>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-[#48CFA4] hover:underline normal-case font-medium"
                            >
                                Reset Pencarian
                            </button>
                        )}
                    </div>

                    {filteredMedicines.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tidak ada obat yang cocok dengan kata kunci "{searchQuery}".
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {filteredMedicines.map((med) => {
                                const isSelected = selectedMedicine && String(selectedMedicine.id) === String(med.id);
                                const batchCount = med.batches?.length || 0;
                                const totalStock = getTotalStock(med);

                                return (
                                    <li
                                        key={med.id}
                                        onClick={() => handleSelectMedicine(med)}
                                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                                            isSelected
                                                ? 'bg-[#EAF5F0] dark:bg-[#253939]/70 border-l-4 border-[#48CFA4]'
                                                : 'hover:bg-gray-50 dark:hover:bg-[#1E272E]'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                                                    {med.name}
                                                </span>
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold flex-shrink-0">
                                                    {med.sku}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                {med.generic_name && (
                                                    <span className="italic truncate">{med.generic_name} •</span>
                                                )}
                                                <span>{med.dosage_form || 'Satuan'}: {med.base_unit || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            {batchCount > 0 ? (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] inline-block">
                                                    {batchCount} Batch ({totalStock} {med.base_unit})
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 inline-block">
                                                    0 Batch (Kosong)
                                                </span>
                                            )}
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
