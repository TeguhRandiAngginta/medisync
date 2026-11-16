import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function StockOpnameIndex({ adjustments }) {
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [showFlash, setShowFlash] = useState(true);

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activeAdjustment, setActiveAdjustment] = useState(null);

    const filterOptions = [
        { value: 'ALL', label: 'Semua Tipe' },
        { value: 'CORRECTION', label: 'Koreksi' },
        { value: 'DAMAGE', label: 'Kerusakan' },
        { value: 'EXPIRED', label: 'Kedaluwarsa' },
        { value: 'LOST', label: 'Hilang' },
    ];

    const getTypeBadge = (type) => {
        switch (type) {
            case 'DAMAGE':
                return <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-bold uppercase tracking-wider">Kerusakan</span>;
            case 'EXPIRED':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg text-xs font-bold uppercase tracking-wider">Kedaluwarsa</span>;
            case 'LOST':
                return <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider">Hilang</span>;
            case 'CORRECTION':
            default:
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider">Koreksi</span>;
        }
    };

    const getDiffBadge = (difference) => {
        if (difference > 0) {
            return (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    +{difference}
                </span>
            );
        } else if (difference < 0) {
            return (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {difference}
                </span>
            );
        }
        return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                0
            </span>
        );
    };

    // Filter adjustments data
    const rawList = adjustments?.data || [];
    const filteredAdjustments = useMemo(() => {
        return rawList.filter((item) => {
            const matchesType = selectedType === 'ALL' || item.type === selectedType;
            if (!matchesType) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const medName = item.medicine?.name?.toLowerCase() || '';
            const sku = item.medicine?.sku?.toLowerCase() || '';
            const batchNo = item.product_batch?.batch_number?.toLowerCase() || '';
            const user = item.user?.name?.toLowerCase() || '';
            const notes = item.notes?.toLowerCase() || '';

            return (
                medName.includes(q) ||
                sku.includes(q) ||
                batchNo.includes(q) ||
                user.includes(q) ||
                notes.includes(q)
            );
        });
    }, [rawList, searchQuery, selectedType]);

    const handleOpenDetailModal = (item) => {
        setActiveAdjustment(item);
        setDetailModalOpen(true);
    };

    return (
        <AuthenticatedLayout header="Stock Opname & Penyesuaian">
            <Head title="Stock Opname" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Riwayat Stock Opname</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Catatan penyesuaian fisik stok obat dan koreksi selisih batch gudang.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link 
                        href={route('batches.index')}
                        title="Cek Masa Kedaluwarsa (FEFO)"
                        className="p-2.5 bg-gray-50 dark:bg-[#151E24] text-gray-600 dark:text-gray-300 hover:text-[#48CFA4] dark:hover:text-[#67E2B4] rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700/60 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </Link>

                    <Link 
                        href={route('stock-adjustments.create')} 
                        title="Catat Stock Opname"
                        className="p-2.5 bg-[#48CFA4] text-white hover:bg-[#3bb890] rounded-md transition-colors shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] flex items-center justify-center cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Flash Message */}
            {flash?.success && showFlash && (
                <div className="mb-6 p-4 rounded-2xl text-xs font-bold flex justify-between items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{flash.success}</span>
                    </div>
                    <button onClick={() => setShowFlash(false)} className="px-2 py-1 hover:opacity-75 cursor-pointer font-bold">
                        ✕
                    </button>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#1E272E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors duration-300">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari obat, SKU, no. batch, petugas..."
                        className="w-full pl-10 pr-9 py-2 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4] transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelectedType(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedType === opt.value
                                    ? 'bg-[#48CFA4] text-white shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:border dark:border-[#30413B]'
                                    : 'bg-gray-50 dark:bg-[#151E24] text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/60 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
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
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredAdjustments.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-6 py-16 text-center text-gray-400 dark:text-gray-500 font-medium">
                                    {searchQuery || selectedType !== 'ALL'
                                        ? 'Tidak ada catatan stock opname yang sesuai dengan filter.'
                                        : 'Belum ada catatan stock opname yang dibuat.'}
                                </td>
                            </tr>
                        ) : (
                            filteredAdjustments.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-gray-800 dark:text-gray-100">{item.medicine?.name || '-'}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{item.medicine?.sku}</div>
                                    </td>
                                    <td className="px-6 py-5 font-mono font-bold text-[#48CFA4]">
                                        {item.product_batch?.batch_number || '-'}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {getTypeBadge(item.type)}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-gray-700 dark:text-gray-200">
                                        {item.system_stock}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-gray-800 dark:text-gray-100">
                                        {item.actual_stock}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {getDiffBadge(item.difference)}
                                    </td>
                                    <td className="px-6 py-5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                        {item.user?.name || '-'}
                                    </td>
                                    <td className="px-6 py-5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.notes || ''}>
                                        {item.notes || '-'}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button 
                                            onClick={() => handleOpenDetailModal(item)} 
                                            title="Lihat Detail Penyesuaian"
                                            className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl hover:bg-[#48CFA4] hover:text-white transition-colors cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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

            {/* MODAL DETAIL RINCIAN PENYESUAIAN STOK */}
            {detailModalOpen && activeAdjustment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white dark:bg-[#1E272E] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div>
                                <span className="px-3 py-1 bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    Rincian Stock Opname
                                </span>
                                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg mt-1 font-mono">
                                    Batch #{activeAdjustment.product_batch?.batch_number || '-'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Dicatat: {new Date(activeAdjustment.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Nama Obat:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-100 text-right">{activeAdjustment.medicine?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">SKU Obat:</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{activeAdjustment.medicine?.sku || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Tipe Penyesuaian:</span>
                                    <div>{getTypeBadge(activeAdjustment.type)}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Petugas Opname:</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{activeAdjustment.user?.name || '-'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 bg-gray-50/50 dark:bg-[#151E24] rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Stok Sistem</span>
                                    <span className="font-mono font-bold text-base text-gray-700 dark:text-gray-200">{activeAdjustment.system_stock}</span>
                                </div>
                                <div className="p-3 bg-gray-50/50 dark:bg-[#151E24] rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Stok Fisik</span>
                                    <span className="font-mono font-bold text-base text-gray-800 dark:text-gray-100">{activeAdjustment.actual_stock}</span>
                                </div>
                                <div className="p-3 bg-gray-50/50 dark:bg-[#151E24] rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Selisih</span>
                                    <div>{getDiffBadge(activeAdjustment.difference)}</div>
                                </div>
                            </div>

                            {activeAdjustment.notes && (
                                <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Keterangan / Catatan:</span>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{activeAdjustment.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
