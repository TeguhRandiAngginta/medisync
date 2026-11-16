import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import InputError from '@/Components/InputError';

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

const RestoreIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
);

// ─── Generic Force Delete Modal ───────────────────────────────────────────────
function ForceDeleteModal({ item, entityLabel, onClose, onConfirm }) {
    if (!item) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Permanen?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {entityLabel} <strong className="text-red-600 dark:text-red-400">{item.name}</strong> akan dihapus <span className="font-black text-red-600">PERMANEN</span> dari database.
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">Batal</button>
                    <button onClick={onConfirm} className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer">Hapus Permanen</button>
                </div>
            </div>
        </div>
    );
}

// ─── Generic Bulk Delete Confirm ──────────────────────────────────────────────
function BulkDeleteModal({ count, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><TrashIcon /></div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus {count} Item Terpilih?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Semua item yang dicentang akan dipindahkan ke tong sampah.</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">Batal</button>
                    <button onClick={onConfirm} className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer">Ya, Hapus Semua</button>
                </div>
            </div>
        </div>
    );
}

// ─── Generic Bulk Restore Confirm ─────────────────────────────────────────────
function BulkRestoreModal({ count, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><RestoreIcon /></div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pulihkan {count} Item Terpilih?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Semua item yang dicentang akan dipulihkan ke daftar aktif.</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">Batal</button>
                    <button onClick={onConfirm} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer">Ya, Pulihkan Semua</button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ currentTab, trashed, data }) {
    const { errors } = usePage().props;

    const tabs = [
        { id: 'tipe-lokasi',   label: 'Tipe Lokasi & Rak' },
        { id: 'tipe-supplier', label: 'Tipe Supplier' },
        { id: 'golongan-obat', label: 'Golongan Obat' },
    ];

    const handleTabChange = (tabId) => {
        router.get(route('references.index'), { tab: tabId }, { preserveState: false, replace: true });
    };

    const switchTrash = (toTrash) => {
        setLocationSelectedIds([]);
        setSupplierSelectedIds([]);
        setCategorySelectedIds([]);
        const params = { tab: currentTab };
        if (toTrash) params.trashed = true;
        router.get(route('references.index'), params, { preserveState: false, replace: true });
    };

    // ─── BADGE COUNTS ──────────────────────────────────────────────────────────
    const trashedLocationCount  = data?.trashedCount?.locationTypes        ?? 0;
    const trashedSupplierCount  = data?.trashedCount?.supplierTypes        ?? 0;
    const trashedCategoryCount  = data?.trashedCount?.medicineCategories   ?? 0;

    // ─── STATE & FORM: LOKASI ─────────────────────────────────────────────────
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation]         = useState(null);
    const [locationSelectedIds, setLocationSelectedIds] = useState([]);
    const [confirmForceDeleteLoc, setConfirmForceDeleteLoc]   = useState(null);
    const [confirmBulkLocDelete, setConfirmBulkLocDelete]     = useState(false);
    const [confirmBulkLocRestore, setConfirmBulkLocRestore]   = useState(false);
    const locationForm = useForm({ name: '', prefix_code: '', intended_for: '', description: '' });

    const openLocationModal = (item = null) => {
        setEditingLocation(item);
        item ? locationForm.setData({ name: item.name, prefix_code: item.prefix_code, intended_for: item.intended_for || '', description: item.description || '' })
             : locationForm.reset();
        setIsLocationModalOpen(true);
    };

    const submitLocation = (e) => {
        e.preventDefault();
        const options = { onSuccess: () => { locationForm.reset(); setIsLocationModalOpen(false); setEditingLocation(null); } };
        editingLocation
            ? locationForm.put(route('references.location-types.update', editingLocation.id), options)
            : locationForm.post(route('references.location-types.store'), options);
    };

    const handleLocSelectAll = (e) => {
        setLocationSelectedIds(e.target.checked ? (data.locationTypes || []).map(t => t.id) : []);
    };
    const handleLocSelectOne = (id) => {
        setLocationSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const executeRestoreLoc = (id) => {
        router.post(route('references.location-types.restore', id), {}, { preserveScroll: true });
    };
    const executeForceDeleteLoc = () => {
        if (!confirmForceDeleteLoc) return;
        router.delete(route('references.location-types.force-delete', confirmForceDeleteLoc.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDeleteLoc(null),
        });
    };
    const executeBulkDestroyLoc = () => {
        router.post(route('references.location-types.bulk-destroy'), { ids: locationSelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkLocDelete(false); setLocationSelectedIds([]); },
            onError: () => setConfirmBulkLocDelete(false),
        });
    };
    const executeBulkRestoreLoc = () => {
        router.post(route('references.location-types.bulk-restore'), { ids: locationSelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkLocRestore(false); setLocationSelectedIds([]); },
            onError: () => setConfirmBulkLocRestore(false),
        });
    };

    // ─── STATE & FORM: SUPPLIER TYPE ──────────────────────────────────────────
    const [isSupplierModalOpen, setIsSupplierModalOpen]   = useState(false);
    const [editingSupplierType, setEditingSupplierType]   = useState(null);
    const [supplierSelectedIds, setSupplierSelectedIds]   = useState([]);
    const [confirmForceDeleteSup, setConfirmForceDeleteSup]   = useState(null);
    const [confirmBulkSupDelete, setConfirmBulkSupDelete]     = useState(false);
    const [confirmBulkSupRestore, setConfirmBulkSupRestore]   = useState(false);
    const supplierForm = useForm({ name: '', prefix_code: '', description: '' });

    const openSupplierModal = (item = null) => {
        setEditingSupplierType(item);
        item ? supplierForm.setData({ name: item.name, prefix_code: item.prefix_code, description: item.description || '' })
             : supplierForm.reset();
        setIsSupplierModalOpen(true);
    };

    const submitSupplierType = (e) => {
        e.preventDefault();
        const options = { onSuccess: () => { supplierForm.reset(); setIsSupplierModalOpen(false); setEditingSupplierType(null); } };
        editingSupplierType
            ? supplierForm.put(route('references.supplier-types.update', editingSupplierType.id), options)
            : supplierForm.post(route('references.supplier-types.store'), options);
    };

    const handleSupSelectAll = (e) => {
        setSupplierSelectedIds(e.target.checked ? (data.supplierTypes || []).map(t => t.id) : []);
    };
    const handleSupSelectOne = (id) => {
        setSupplierSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const executeRestoreSup = (id) => {
        router.post(route('references.supplier-types.restore', id), {}, { preserveScroll: true });
    };
    const executeForceDeleteSup = () => {
        if (!confirmForceDeleteSup) return;
        router.delete(route('references.supplier-types.force-delete', confirmForceDeleteSup.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDeleteSup(null),
        });
    };
    const executeBulkDestroySup = () => {
        router.post(route('references.supplier-types.bulk-destroy'), { ids: supplierSelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkSupDelete(false); setSupplierSelectedIds([]); },
            onError: () => setConfirmBulkSupDelete(false),
        });
    };
    const executeBulkRestoreSup = () => {
        router.post(route('references.supplier-types.bulk-restore'), { ids: supplierSelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkSupRestore(false); setSupplierSelectedIds([]); },
            onError: () => setConfirmBulkSupRestore(false),
        });
    };

    // ─── STATE & FORM: GOLONGAN OBAT ──────────────────────────────────────────
    const [isCategoryModalOpen, setIsCategoryModalOpen]   = useState(false);
    const [editingCategory, setEditingCategory]           = useState(null);
    const [categorySelectedIds, setCategorySelectedIds]   = useState([]);
    const [confirmForceDeleteCat, setConfirmForceDeleteCat] = useState(null);
    const [confirmBulkCatDelete, setConfirmBulkCatDelete]   = useState(false);
    const [confirmBulkCatRestore, setConfirmBulkCatRestore] = useState(false);
    const categoryForm = useForm({ name: '', description: '' });

    const openCategoryModal = (item = null) => {
        setEditingCategory(item);
        item ? categoryForm.setData({ name: item.name, description: item.description || '' })
             : categoryForm.reset();
        setIsCategoryModalOpen(true);
    };

    const submitCategory = (e) => {
        e.preventDefault();
        const options = { onSuccess: () => { categoryForm.reset(); setIsCategoryModalOpen(false); setEditingCategory(null); } };
        editingCategory
            ? categoryForm.put(route('references.medicine-categories.update', editingCategory.id), options)
            : categoryForm.post(route('references.medicine-categories.store'), options);
    };

    const handleCatSelectAll = (e) => {
        setCategorySelectedIds(e.target.checked ? (data.medicineCategories || []).map(c => c.id) : []);
    };
    const handleCatSelectOne = (id) => {
        setCategorySelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const executeRestoreCategory = (id) => {
        router.post(route('references.medicine-categories.restore', id), {}, { preserveScroll: true });
    };
    const executeForceDeleteCategory = () => {
        if (!confirmForceDeleteCat) return;
        router.delete(route('references.medicine-categories.force-delete', confirmForceDeleteCat.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDeleteCat(null),
        });
    };
    const executeBulkDestroyCat = () => {
        router.post(route('references.medicine-categories.bulk-destroy'), { ids: categorySelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkCatDelete(false); setCategorySelectedIds([]); },
            onError: () => setConfirmBulkCatDelete(false),
        });
    };
    const executeBulkRestoreCat = () => {
        router.post(route('references.medicine-categories.bulk-restore'), { ids: categorySelectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkCatRestore(false); setCategorySelectedIds([]); },
            onError: () => setConfirmBulkCatRestore(false),
        });
    };

    // ─── FUNGSI HAPUS (soft delete) untuk LOKASI & SUPPLIER (non-trash actions) ─
    // Karena sekarang destroy sudah menjadi soft delete, kita tidak lagi butuh modal hapus global
    const executeDestroyLoc = (id) => {
        router.delete(route('references.location-types.destroy', id), { preserveScroll: true });
    };
    const executeDestroySup = (id) => {
        router.delete(route('references.supplier-types.destroy', id), { preserveScroll: true });
    };
    const executeDestroyCategory = (id) => {
        router.delete(route('references.medicine-categories.destroy', id), { preserveScroll: true });
    };

    // ─── SHARED: trash toggle count untuk tab aktif ───────────────────────────
    const currentTrashedCount = currentTab === 'tipe-lokasi'
        ? trashedLocationCount
        : currentTab === 'tipe-supplier'
            ? trashedSupplierCount
            : trashedCategoryCount;

    const currentSelectedIds = currentTab === 'tipe-lokasi'
        ? locationSelectedIds
        : currentTab === 'tipe-supplier'
            ? supplierSelectedIds
            : categorySelectedIds;

    return (
        <AuthenticatedLayout header="Data Referensi Sistem">
            <Head title="Data Referensi" />

            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Parameter &amp; Referensi</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kelola master data pendukung yang akan digunakan pada seluruh dropdown fitur utama.</p>
            </div>

            {/* Tab Navigasi Utama */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar">
                {tabs.map((tab) => {
                    const count = tab.id === 'tipe-lokasi' ? trashedLocationCount
                        : tab.id === 'tipe-supplier' ? trashedSupplierCount
                        : trashedCategoryCount;
                    return (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 
                                ${currentTab === tab.id
                                    ? 'bg-[#48CFA4] text-white shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:border dark:border-[#48CFA4]/30'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 dark:bg-[#1E272E] dark:text-gray-400 dark:border-gray-800 dark:hover:bg-[#151E24]'
                                }`}>
                            {tab.label}
                            {count > 0 && currentTab !== tab.id && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ─── SUB-HEADER: Trash Toggle + Bulk Actions (untuk semua tab) ─────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Restore (di tab trash) */}
                    {currentSelectedIds.length > 0 && trashed && (
                        <button
                            onClick={() => {
                                if (currentTab === 'tipe-lokasi') setConfirmBulkLocRestore(true);
                                else if (currentTab === 'tipe-supplier') setConfirmBulkSupRestore(true);
                                else setConfirmBulkCatRestore(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-blue-600/20">
                            <RestoreIcon />
                            <span>Pulihkan ({currentSelectedIds.length})</span>
                        </button>
                    )}
                    {/* Bulk Delete (di tab aktif) */}
                    {currentSelectedIds.length > 0 && !trashed && (
                        <button
                            onClick={() => {
                                if (currentTab === 'tipe-lokasi') setConfirmBulkLocDelete(true);
                                else if (currentTab === 'tipe-supplier') setConfirmBulkSupDelete(true);
                                else setConfirmBulkCatDelete(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-red-600/20">
                            <TrashIcon />
                            <span>Hapus ({currentSelectedIds.length})</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Tab toggle: Aktif / Trash */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button onClick={() => switchTrash(false)}
                            className={`px-4 py-2 text-xs font-bold transition-colors ${!trashed ? 'bg-[#48CFA4] text-white dark:bg-[#253939] dark:text-[#67E2B4]' : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'}`}>
                            Data Aktif
                        </button>
                        <button onClick={() => switchTrash(true)}
                            className={`px-4 py-2 text-xs font-bold transition-colors flex items-center gap-2 ${trashed ? 'bg-red-500 text-white' : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'}`}>
                            🗑️ Trash
                            {currentTrashedCount > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${trashed ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                    {currentTrashedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Add button (hanya di tab aktif) */}
                    {!trashed && currentTab === 'tipe-lokasi' && (
                        <button onClick={() => openLocationModal()} className="px-4 py-2 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-lg font-bold text-xs hover:bg-[#48CFA4] hover:text-white transition-colors cursor-pointer">
                            + Tambah Tipe Baru
                        </button>
                    )}
                    {!trashed && currentTab === 'tipe-supplier' && (
                        <button onClick={() => openSupplierModal()} className="px-4 py-2 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-lg font-bold text-xs hover:bg-[#48CFA4] hover:text-white transition-colors cursor-pointer">
                            + Tambah Tipe Pemasok
                        </button>
                    )}
                    {!trashed && currentTab === 'golongan-obat' && (
                        <button onClick={() => openCategoryModal()} className="px-4 py-2 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-lg font-bold text-xs hover:bg-[#48CFA4] hover:text-white transition-colors cursor-pointer">
                            + Tambah Golongan
                        </button>
                    )}
                </div>
            </div>

            {/* ─── TAB: TIPE LOKASI ─────────────────────────────────────────────────── */}
            {currentTab === 'tipe-lokasi' && (
                <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <input type="checkbox"
                                        onChange={handleLocSelectAll}
                                        checked={(data.locationTypes?.length ?? 0) > 0 && locationSelectedIds.length === (data.locationTypes?.length ?? 0)}
                                        className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold">Prefix Kode</th>
                                <th className="px-6 py-4 font-bold">Nama Tipe</th>
                                <th className="px-6 py-4 font-bold">Peruntukan</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                {trashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                                <th className="px-6 py-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data.locationTypes || data.locationTypes.length === 0 ? (
                                <tr><td colSpan={trashed ? 7 : 6} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                    {trashed ? '🗑️ Keranjang sampah kosong.' : 'Belum ada data referensi.'}
                                </td></tr>
                            ) : (
                                data.locationTypes.map((type) => (
                                    <tr key={type.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] ${locationSelectedIds.includes(type.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox"
                                                checked={locationSelectedIds.includes(type.id)}
                                                onChange={() => handleLocSelectOne(type.id)}
                                                className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[#48CFA4]">{type.prefix_code}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{type.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{type.intended_for || 'Umum'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {trashed ? (
                                                <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full">Dihapus</span>
                                            ) : (
                                                <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[10px] font-bold px-2 py-1 rounded-full">Aktif</span>
                                            )}
                                        </td>
                                        {trashed && (
                                            <td className="px-6 py-4 text-center text-xs text-gray-400 font-mono">
                                                {type.deleted_at ? new Date(type.deleted_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                {trashed ? (
                                                    <>
                                                        <button onClick={() => executeRestoreLoc(type.id)} title="Pulihkan"
                                                            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200 cursor-pointer"><RestoreIcon /></button>
                                                        <button onClick={() => setConfirmForceDeleteLoc(type)} title="Hapus Permanen"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openLocationModal(type)}
                                                            className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><EditIcon /></button>
                                                        <button onClick={() => executeDestroyLoc(type.id)} title="Pindah ke Trash"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── TAB: TIPE SUPPLIER ───────────────────────────────────────────────── */}
            {currentTab === 'tipe-supplier' && (
                <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <input type="checkbox"
                                        onChange={handleSupSelectAll}
                                        checked={(data.supplierTypes?.length ?? 0) > 0 && supplierSelectedIds.length === (data.supplierTypes?.length ?? 0)}
                                        className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold">Prefix Kode</th>
                                <th className="px-6 py-4 font-bold">Kategori Pemasok</th>
                                <th className="px-6 py-4 font-bold">Keterangan</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                {trashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                                <th className="px-6 py-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data.supplierTypes || data.supplierTypes.length === 0 ? (
                                <tr><td colSpan={trashed ? 7 : 6} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                    {trashed ? '🗑️ Keranjang sampah kosong.' : 'Belum ada tipe pemasok terdaftar.'}
                                </td></tr>
                            ) : (
                                data.supplierTypes.map((type) => (
                                    <tr key={type.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] ${supplierSelectedIds.includes(type.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox"
                                                checked={supplierSelectedIds.includes(type.id)}
                                                onChange={() => handleSupSelectOne(type.id)}
                                                className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-blue-500">{type.prefix_code}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{type.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{type.description || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {trashed ? (
                                                <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full">Dihapus</span>
                                            ) : (
                                                <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[10px] font-bold px-2 py-1 rounded-full">Aktif</span>
                                            )}
                                        </td>
                                        {trashed && (
                                            <td className="px-6 py-4 text-center text-xs text-gray-400 font-mono">
                                                {type.deleted_at ? new Date(type.deleted_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                {trashed ? (
                                                    <>
                                                        <button onClick={() => executeRestoreSup(type.id)} title="Pulihkan"
                                                            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200 cursor-pointer"><RestoreIcon /></button>
                                                        <button onClick={() => setConfirmForceDeleteSup(type)} title="Hapus Permanen"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openSupplierModal(type)}
                                                            className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><EditIcon /></button>
                                                        <button onClick={() => executeDestroySup(type.id)} title="Pindah ke Trash"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── TAB: GOLONGAN OBAT ───────────────────────────────────────────────── */}
            {currentTab === 'golongan-obat' && (
                <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <input type="checkbox"
                                        onChange={handleCatSelectAll}
                                        checked={(data.medicineCategories?.length ?? 0) > 0 && categorySelectedIds.length === (data.medicineCategories?.length ?? 0)}
                                        className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold">Nama Golongan</th>
                                <th className="px-6 py-4 font-bold">Keterangan</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                {trashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                                <th className="px-6 py-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data.medicineCategories || data.medicineCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={trashed ? 6 : 5} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                        {trashed ? '🗑️ Keranjang sampah kosong.' : 'Belum ada golongan obat terdaftar.'}
                                    </td>
                                </tr>
                            ) : (
                                data.medicineCategories.map((cat) => (
                                    <tr key={cat.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] ${categorySelectedIds.includes(cat.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox"
                                                checked={categorySelectedIds.includes(cat.id)}
                                                onChange={() => handleCatSelectOne(cat.id)}
                                                className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{cat.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{cat.description || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {trashed ? (
                                                <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full">Dihapus</span>
                                            ) : (
                                                <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[10px] font-bold px-2 py-1 rounded-full">Aktif</span>
                                            )}
                                        </td>
                                        {trashed && (
                                            <td className="px-6 py-4 text-center text-xs text-gray-400 font-mono">
                                                {cat.deleted_at ? new Date(cat.deleted_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                {trashed ? (
                                                    <>
                                                        <button onClick={() => executeRestoreCategory(cat.id)} title="Pulihkan"
                                                            className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200 cursor-pointer"><RestoreIcon /></button>
                                                        <button onClick={() => setConfirmForceDeleteCat(cat)} title="Hapus Permanen"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openCategoryModal(cat)} title="Edit"
                                                            className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><EditIcon /></button>
                                                        <button onClick={() => executeDestroyCategory(cat.id)} title="Pindah ke Trash"
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"><TrashIcon /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── MODAL: LOKASI FORM ───────────────────────────────────────────────── */}
            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsLocationModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editingLocation ? 'Edit Tipe Lokasi' : 'Tambah Tipe Lokasi Baru'}</h3>
                        <form onSubmit={submitLocation} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Prefix Kode</label>
                                <input type="text" value={locationForm.data.prefix_code} onChange={e => locationForm.setData('prefix_code', e.target.value)} placeholder="Misal: KKS" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white uppercase font-bold focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" required />
                                <InputError message={locationForm.errors.prefix_code} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Tipe</label>
                                <input type="text" value={locationForm.data.name} onChange={e => locationForm.setData('name', e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" />
                                <InputError message={locationForm.errors.name} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Peruntukan</label>
                                <input type="text" value={locationForm.data.intended_for} onChange={e => locationForm.setData('intended_for', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#151E24] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer">Batal</button>
                                <button type="submit" disabled={locationForm.processing} className="flex-1 px-4 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-md shadow-[#48CFA4]/20 transition-colors disabled:opacity-50 cursor-pointer">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: SUPPLIER TYPE FORM ────────────────────────────────────────── */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSupplierModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editingSupplierType ? 'Edit Tipe Pemasok' : 'Tambah Tipe Pemasok Baru'}</h3>
                        <form onSubmit={submitSupplierType} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Prefix Kode</label>
                                <input type="text" value={supplierForm.data.prefix_code} onChange={e => supplierForm.setData('prefix_code', e.target.value)} placeholder="Misal: PBF" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white uppercase font-bold focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" required />
                                <InputError message={supplierForm.errors.prefix_code} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori Pemasok</label>
                                <input type="text" value={supplierForm.data.name} onChange={e => supplierForm.setData('name', e.target.value)} placeholder="Misal: Pedagang Besar Farmasi" required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" />
                                <InputError message={supplierForm.errors.name} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Keterangan Tambahan</label>
                                <textarea value={supplierForm.data.description} onChange={e => supplierForm.setData('description', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none"></textarea>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#151E24] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer">Batal</button>
                                <button type="submit" disabled={supplierForm.processing} className="flex-1 px-4 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-md shadow-[#48CFA4]/20 transition-colors disabled:opacity-50 cursor-pointer">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: GOLONGAN OBAT FORM ────────────────────────────────────────── */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editingCategory ? 'Edit Golongan Obat' : 'Tambah Golongan Baru'}</h3>
                        <form onSubmit={submitCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Golongan Obat</label>
                                <input type="text" value={categoryForm.data.name} onChange={e => categoryForm.setData('name', e.target.value)} placeholder="Misal: Obat Bebas, Obat Keras" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white font-bold focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none" required />
                                <InputError message={categoryForm.errors.name} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Keterangan (Opsional)</label>
                                <textarea value={categoryForm.data.description} onChange={e => categoryForm.setData('description', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none"></textarea>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#151E24] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer">Batal</button>
                                <button type="submit" disabled={categoryForm.processing} className="flex-1 px-4 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-md shadow-[#48CFA4]/20 transition-colors disabled:opacity-50 cursor-pointer">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── FORCE DELETE MODALS ──────────────────────────────────────────────── */}
            <ForceDeleteModal item={confirmForceDeleteLoc} entityLabel="Tipe Lokasi" onClose={() => setConfirmForceDeleteLoc(null)} onConfirm={executeForceDeleteLoc} />
            <ForceDeleteModal item={confirmForceDeleteSup} entityLabel="Tipe Supplier" onClose={() => setConfirmForceDeleteSup(null)} onConfirm={executeForceDeleteSup} />
            <ForceDeleteModal item={confirmForceDeleteCat} entityLabel="Golongan Obat" onClose={() => setConfirmForceDeleteCat(null)} onConfirm={executeForceDeleteCategory} />

            {/* ─── BULK DELETE MODALS ───────────────────────────────────────────────── */}
            {confirmBulkLocDelete && <BulkDeleteModal count={locationSelectedIds.length} onClose={() => setConfirmBulkLocDelete(false)} onConfirm={executeBulkDestroyLoc} />}
            {confirmBulkSupDelete && <BulkDeleteModal count={supplierSelectedIds.length} onClose={() => setConfirmBulkSupDelete(false)} onConfirm={executeBulkDestroySup} />}
            {confirmBulkCatDelete && <BulkDeleteModal count={categorySelectedIds.length} onClose={() => setConfirmBulkCatDelete(false)} onConfirm={executeBulkDestroyCat} />}

            {/* ─── BULK RESTORE MODALS ──────────────────────────────────────────────── */}
            {confirmBulkLocRestore && <BulkRestoreModal count={locationSelectedIds.length} onClose={() => setConfirmBulkLocRestore(false)} onConfirm={executeBulkRestoreLoc} />}
            {confirmBulkSupRestore && <BulkRestoreModal count={supplierSelectedIds.length} onClose={() => setConfirmBulkSupRestore(false)} onConfirm={executeBulkRestoreSup} />}
            {confirmBulkCatRestore && <BulkRestoreModal count={categorySelectedIds.length} onClose={() => setConfirmBulkCatRestore(false)} onConfirm={executeBulkRestoreCat} />}

        </AuthenticatedLayout>
    );
}
