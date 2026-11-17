import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import Pagination from '@/Components/Pagination';
import { useState, useEffect } from 'react';

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

export default function Index({ products: productsPage = { data: [] }, showTrashed = false, trashedCount = 0 }) {
    const products = productsPage?.data ?? [];
    const [selectedIds, setSelectedIds]                 = useState([]);
    const [confirmDelete, setConfirmDelete]             = useState(null);       // product object to soft delete
    const [confirmForceDelete, setConfirmForceDelete]   = useState(null);       // product object to force delete
    const [confirmBulkDelete, setConfirmBulkDelete]     = useState(false);
    const [confirmBulkRestore, setConfirmBulkRestore]   = useState(false);
    const [confirmBulkForceDelete, setConfirmBulkForceDelete] = useState(false);

    // Pilihan hanya berlaku untuk halaman yang sedang tampil: kosongkan saat pindah halaman/tab
    // agar aksi massal tidak mengenai data yang tidak terlihat.
    useEffect(() => { setSelectedIds([]); }, [productsPage?.current_page, showTrashed]);

    const switchTab = (toTrash) => {
        setSelectedIds([]);
        router.get(route('products.index'), toTrash ? { trashed: true } : {}, { preserveScroll: true, replace: true });
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? products.map(p => p.id) : []);
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const executeDelete = () => {
        if (!confirmDelete) return;
        router.delete(route('products.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmDelete(null),
        });
    };

    const executeRestore = (id) => {
        router.post(route('products.restore', id), {}, {
            preserveScroll: true,
        });
    };

    const executeForceDelete = () => {
        if (!confirmForceDelete) return;
        router.delete(route('products.force-delete', confirmForceDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDelete(null),
        });
    };

    const executeBulkDestroy = () => {
        router.post(route('products.bulk-destroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkDelete(false);
                setSelectedIds([]);
            },
        });
    };

    const executeBulkRestore = () => {
        router.post(route('products.bulk-restore'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkRestore(false);
                setSelectedIds([]);
            },
        });
    };

    const executeBulkForceDelete = () => {
        router.post(route('products.bulk-force-delete'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkForceDelete(false);
                setSelectedIds([]);
            },
            onError: () => {
                setConfirmBulkForceDelete(false);
            },
        });
    };

    return (
        <AuthenticatedLayout header="Katalog Produk & Obat">
            <Head title={showTrashed ? 'Trash - Katalog Obat' : 'Katalog Produk'} />

            {/* Header & Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Daftar Master Data Obat</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Pusat data SKU, kategori, dan spesifikasi medis produk.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Action Buttons */}
                    {selectedIds.length > 0 && showTrashed && (
                        <>
                            <button
                                onClick={() => setConfirmBulkRestore(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-blue-600/20"
                            >
                                <RestoreIcon />
                                <span>Pulihkan ({selectedIds.length})</span>
                            </button>
                            <button
                                onClick={() => setConfirmBulkForceDelete(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                            >
                                <TrashIcon />
                                <span>Hapus Permanen ({selectedIds.length})</span>
                            </button>
                        </>
                    )}

                    {selectedIds.length > 0 && !showTrashed && (
                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                        >
                            <TrashIcon />
                            <span>Hapus ({selectedIds.length})</span>
                        </button>
                    )}

                    {/* Tab Toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => switchTab(false)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                !showTrashed
                                    ? 'bg-[#48CFA4] text-white dark:bg-[#253939] dark:text-[#67E2B4]'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            Data Aktif
                        </button>
                        <button
                            onClick={() => switchTab(true)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                                showTrashed
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            <TrashIcon />
                                Trash
                            {trashedCount > 0 && (
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        showTrashed
                                            ? 'bg-white/20 text-white'
                                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                    }`}
                                >
                                    {trashedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {!showTrashed && (
                        <Link
                            href={route('products.create')}
                            title="Tambah Produk Baru"
                            className="p-2.5 bg-[#48CFA4] text-white hover:bg-[#3bb890] rounded-md transition-colors shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] flex items-center justify-center cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </Link>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-4 py-4 w-10 text-center">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={products.length > 0 && selectedIds.length === products.length}
                                    className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-4 font-bold">SKU / Nama Obat</th>
                            <th className="px-6 py-4 font-bold">Golongan</th>
                            <th className="px-6 py-4 font-bold">Dosis & Satuan</th>
                            <th className="px-6 py-4 font-bold">Rak (Lokasi)</th>
                            <th className="px-6 py-4 font-bold text-center">Resep</th>
                            {showTrashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!products || products.length === 0 ? (
                            <tr>
                                <td colSpan={showTrashed ? 8 : 7} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                    {showTrashed ? 'Keranjang sampah obat kosong.' : 'Katalog obat masih kosong.'}
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors ${
                                        selectedIds.includes(product.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                    }`}
                                >
                                    {/* CHECKBOX */}
                                    <td className="px-4 py-5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => handleSelectOne(product.id)}
                                            className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                        />
                                    </td>

                                    {/* 1. KOLOM SKU & NAMA (Dan Status Aktif) */}
                                    <td className="px-6 py-5">
                                        <div className="font-mono text-xs text-gray-500 mb-1">{product.sku}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-blue-600 dark:text-[#6FD8E8]">{product.name}</div>
                                            {!showTrashed && !product.is_active && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-200 dark:border-red-800">
                                                    NONAKTIF
                                                </span>
                                            )}
                                        </div>
                                        {product.generic_name && (
                                            <div className="text-[11px] text-gray-400 mt-0.5">{product.generic_name}</div>
                                        )}
                                    </td>

                                    {/* 2. KOLOM GOLONGAN */}
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                                            {product.category?.name || '-'}
                                        </span>
                                    </td>

                                    {/* 3. KOLOM DOSIS & SATUAN */}
                                    <td className="px-6 py-5 text-gray-700 dark:text-gray-300">
                                        <span className="font-bold">{product.dosage_strength || '-'}</span> {product.dosage_form}
                                        <div className="text-xs text-gray-400 mt-1">
                                            Satuan: <span className="font-bold">{product.base_unit}</span>
                                        </div>
                                    </td>

                                    {/* 4. KOLOM RAK */}
                                    <td className="px-6 py-5 font-bold text-[#48CFA4]">{product.rack?.code || '-'}</td>

                                    {/* 5. KOLOM RESEP */}
                                    <td className="px-6 py-5 text-center">
                                        {product.requires_prescription ? (
                                            <span className="text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">
                                                Wajib
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>

                                    {/* KOLOM DIHAPUS PADA (TRASH ONLY) */}
                                    {showTrashed && (
                                        <td className="px-6 py-5 text-center text-xs text-gray-400 font-mono">
                                            {product.deleted_at ? new Date(product.deleted_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    )}

                                    {/* 6. KOLOM AKSI */}
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            {showTrashed ? (
                                                <>
                                                    <button
                                                        onClick={() => executeRestore(product.id)}
                                                        title="Pulihkan Obat"
                                                        className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <RestoreIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmForceDelete(product)}
                                                        title="Hapus Permanen"
                                                        className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={route('products.edit', product.id)}
                                                        title="Edit Obat"
                                                        className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200"
                                                    >
                                                        <EditIcon />
                                                    </Link>
                                                    <button
                                                        onClick={() => setConfirmDelete(product)}
                                                        title="Pindah ke Trash"
                                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                                                    >
                                                        <TrashIcon />
                                                    </button>
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

            <Pagination links={productsPage?.links} meta={productsPage} />

            {/* MODAL: Konfirmasi Soft Delete */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pindah ke Tong Sampah?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Obat <strong className="text-gray-800 dark:text-gray-200">{confirmDelete.name}</strong> akan dipindahkan ke tong sampah. Data dapat dipulihkan kapan saja selama belum dihapus permanen.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Pindahkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Konfirmasi Force Delete */}
            {confirmForceDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Permanen?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Obat <strong className="text-red-600 dark:text-red-400">{confirmForceDelete.name}</strong> akan dihapus <span className="font-black text-red-600">PERMANEN</span> dari database.
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            Tindakan ini tidak dapat dibatalkan!
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmForceDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeForceDelete}
                                className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer"
                            >
                                Hapus Permanen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Delete */}
            {confirmBulkDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Hapus {selectedIds.length} Obat Terpilih?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Semua obat yang dicentang akan dipindahkan ke tong sampah secara bersamaan (hanya obat tanpa stok aktif yang akan diproses).
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkDestroy}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Restore */}
            {confirmBulkRestore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RestoreIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Pulihkan {selectedIds.length} Obat Terpilih?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Semua obat yang dicentang akan dipulihkan ke daftar aktif.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkRestore(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkRestore}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
                            >
                                Ya, Pulihkan Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Force Delete */}
            {confirmBulkForceDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Hapus Permanen {selectedIds.length} Obat Terpilih?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Semua obat yang dicentang akan dihapus <span className="font-black text-red-600">PERMANEN</span> dari database (obat yang memiliki riwayat transaksi akan otomatis dilewati).
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            Tindakan ini tidak dapat dibatalkan!
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkForceDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkForceDelete}
                                className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer"
                            >
                                Ya, Hapus Permanen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
