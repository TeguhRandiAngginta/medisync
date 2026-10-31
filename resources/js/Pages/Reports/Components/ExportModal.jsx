import React, { useState, useEffect } from 'react';

export default function ExportModal({ 
    isOpen, 
    onClose, 
    selectedReportType, 
    setSelectedReportType, 
    startDate, 
    setStartDate, 
    endDate, 
    setEndDate, 
    exportFormat, 
    setExportFormat, 
    handleExecuteExport,
    setPresetDate
}) {
    const [activePreset, setActivePreset] = useState('bulan_ini');

    useEffect(() => {
        if (isOpen) setActivePreset('bulan_ini');
    }, [isOpen]);

    const handlePresetClick = (preset) => {
        setActivePreset(preset);
        if (preset !== 'kustom') {
            setPresetDate(preset);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E272E] rounded-[24px] w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#151E24]/50">
                    <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Pengaturan Ekspor</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white dark:bg-[#2A343D] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Pilih Jenis Laporan</label>
                        <select 
                            value={selectedReportType} 
                            onChange={(e) => setSelectedReportType(e.target.value)}
                            className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151E24] text-gray-800 dark:text-gray-200 focus:ring-[#48CFA4] focus:border-[#48CFA4] cursor-pointer"
                        >
                            <option value="sales">Laporan Penjualan (Omzet & Struk)</option>
                            <option value="purchase">Laporan Pembelian & Supplier</option>
                            <option value="profit">Laporan Laba Rugi & HPP</option>
                            <option value="stock">Laporan Stok Kritis & Kedaluwarsa</option>
                        </select>
                    </div>

                    {/* Periode Data */}
                    {selectedReportType !== 'stock' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Periode Data</label>

                            <div className="grid grid-cols-5 gap-1.5">
                                {[
                                    { id: 'hari_ini', label: 'Hari Ini' },
                                    { id: 'minggu_ini', label: 'Minggu' },
                                    { id: 'bulan_ini', label: 'Bulan' },
                                    { id: 'tahun_ini', label: 'Tahun' },
                                    { id: 'kustom', label: 'Kustom' }
                                ].map((preset) => {
                                    const isActive = activePreset === preset.id;
                                    return (
                                        <button 
                                            key={preset.id}
                                            onClick={() => handlePresetClick(preset.id)}
                                            className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                                isActive 
                                                ? 'border-[#48CFA4]/50 bg-[#EAF5F0] dark:bg-[#1C332B] text-[#246A55] dark:text-[#48CFA4] shadow-sm' 
                                                : 'border-transparent bg-gray-100 dark:bg-[#2A343D] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#32404A]'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {activePreset === 'kustom' && (
                                <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="relative w-full">
                                        <input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={e => setStartDate(e.target.value)} 
                                            className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-700 dark:text-gray-200 focus:ring-[#48CFA4] focus:border-[#48CFA4] dark:[color-scheme:dark] cursor-pointer" 
                                        />
                                    </div>
                                    <span className="text-gray-400 text-xs font-bold">s/d</span>
                                    <div className="relative w-full">
                                        <input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={e => setEndDate(e.target.value)} 
                                            className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-700 dark:text-gray-200 focus:ring-[#48CFA4] focus:border-[#48CFA4] dark:[color-scheme:dark] cursor-pointer" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Format Berkas Ekspor</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'pdf', label: 'PDF / Cetak A4', icon: '📄' },
                                { id: 'excel', label: 'Excel (.xlsx)', icon: '📊' }
                            ].map(fmt => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setExportFormat(fmt.id)}
                                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center gap-2 cursor-pointer ${
                                        exportFormat === fmt.id 
                                        ? 'border-[#48CFA4] bg-[#EAF5F0]/50 dark:bg-[#1C332B]/60 text-[#246A55] dark:text-[#48CFA4] shadow-sm' 
                                        : 'border-gray-200 dark:border-gray-700/80 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#2A343D] hover:bg-gray-100 dark:hover:bg-[#32404A]'
                                    }`}
                                >
                                    <span className="text-2xl">{fmt.icon}</span>
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151E24]/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A343D] rounded-xl transition-colors cursor-pointer">
                        Batal
                    </button>
                    <button onClick={handleExecuteExport} className="px-6 py-2.5 bg-[#48CFA4] hover:bg-[#3bb790] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer">
                        Unduh / Ekspor
                    </button>
                </div>
            </div>
        </div>
    );
}