import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
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

export default function Index({ racks, trashed, trashedCount }) {
    const { flash, errors } = usePage().props;

    const [selectedIds, setSelectedIds]                 = useState([]);
    const [confirmDelete, setConfirmDelete]             = useState(null);       // rack object
    const [confirmForceDelete, setConfirmForceDelete]   = useState(null);       // rack object
    const [confirmBulkDelete, setConfirmBulkDelete]     = useState(false);
    const [confirmBulkRestore, setConfirmBulkRestore]   = useState(false);

    const switchTab = (toTrash) => {
        setSelectedIds([]);
        router.get(route('racks.index'), toTrash ? { trashed: true } : {}, { preserveScroll: true, replace: true });
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? racks.map(r => r.id) : []);
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const executeDelete = () => {
        if (!confirmDelete) return;
        router.delete(route('racks.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmDelete(null),
        });
    };

    const executeRestore = (id) => {
        router.post(route('racks.restore', id), {}, {
            preserveScroll: true,
        });
    };

    const executeForceDelete = () => {
        if (!confirmForceDelete) return;
        router.delete(route('racks.force-delete', confirmForceDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDelete(null),
        });
    };

    const executeBulkDestroy = () => {
        router.post(route('racks.bulk-destroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkDelete(false); setSelectedIds([]); },
            onError: () => setConfirmBulkDelete(false),
        });
    };

    const executeBulkRestore = () => {
        router.post(route('racks.bulk-restore'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => { setConfirmBulkRestore(false); setSelectedIds([]); },
            onError: () => setConfirmBulkRestore(false),
        });
    };

    return (
        <AuthenticatedLayout header="Lokasi Rak Penyimpanan">
            <Head title="Data Rak" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Daftar Etalase &amp; Gudang</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Kelola titik lokasi penyimpanan fisik obat di apotek Anda.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && trashed && (
                        <button onClick={() => setConfirmBulkRestore(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-blue-600/20">
                            <RestoreIcon />
                            <span>Pulihkan ({selectedIds.length})</span>
                        </button>
                    )}
                    {selectedIds.length > 0 && !trashed && (
                        <button onClick={() => setConfirmBulkDelete(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20">
                            <TrashIcon />
                            <span>Hapus ({selectedIds.length})</span>
                        </button>
                    )}

                    {/* Tab Toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button onClick={() => switchTab(false)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors ${!trashed ? 'bg-[#48CFA4] text-white dark:bg-[#253939] dark:text-[#67E2B4]' : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'}`}>
                            Data Aktif
                        </button>
                        <button onClick={() => switchTab(true)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${trashed ? 'bg-red-500 text-white' : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'}`}>
                            🗑️ Trash
                            {trashedCount > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${trashed ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                    {trashedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Add Button (only on active tab) */}
                    {!trashed && (
                        <Link href={route('racks.create')} title="Tambah Lokasi Baru"
                            className="p-2.5 bg-[#48CFA4] text-white hover:bg-[#3bb890] rounded-md transition-colors shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] flex items-center justify-center cursor-pointer">
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
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-4 py-4 w-10 text-center">
                                <input type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={racks.length > 0 && selectedIds.length === racks.length}
                                    className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-4 font-bold">Kode Lokasi</th>
                            <th className="px-6 py-4 font-bold">Nama Rak / Etalase</th>
                            <th className="px-6 py-4 font-bold">Keterangan</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            {trashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {racks.length === 0 ? (
                            <tr>
                                <td colSpan={trashed ? 7 : 6} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                    {trashed ? '🗑️ Keranjang sampah kosong.' : 'Belum ada data rak penyimpanan.'}
                                </td>
                            </tr>
                        ) : (
                            racks.map((rack) => (
                                <tr key={rack.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors ${selectedIds.includes(rack.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                    <td className="px-4 py-5 text-center">
                                        <input type="checkbox"
                                            checked={selectedIds.includes(rack.id)}
                                            onChange={() => handleSelectOne(rack.id)}
                                            className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5 font-medium text-gray-900 dark:text-gray-200">{rack.code}</td>
                                    <td className="px-6 py-5 font-bold text-blue-600 dark:text-[#6FD8E8]">{rack.name}</td>
                                    <td className="px-6 py-5 text-gray-600 dark:text-gray-400">{rack.description || '-'}</td>
                                    <td className="px-6 py-5 text-center">
                                        {trashed ? (
                                            <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">Dihapus</span>
                                        ) : rack.is_active ? (
                                            <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full">Aktif</span>
                                        ) : (
                                            <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">Nonaktif</span>
                                        )}
                                    </td>
                                    {trashed && (
                                        <td className="px-6 py-5 text-center text-xs text-gray-400 font-mono">
                                            {rack.deleted_at ? new Date(rack.deleted_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {trashed ? (
                                                <>
                                                    <button onClick={() => executeRestore(rack.id)} title="Pulihkan Rak"
                                                        className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors cursor-pointer">
                                                        <RestoreIcon />
                                                    </button>
                                                    <button onClick={() => setConfirmForceDelete(rack)} title="Hapus Permanen"
                                                        className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href={route('racks.edit', rack.id)} title="Edit Rak"
                                                        className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200">
                                                        <EditIcon />
                                                    </Link>
                                                    <button onClick={() => setConfirmDelete(rack)} title="Pindah ke Trash"
                                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer">
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

            {/* MODAL: Konfirmasi Soft Delete */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pindah ke Tong Sampah?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Lokasi rak <strong className="text-gray-800 dark:text-gray-200">{confirmDelete.name}</strong> akan dipindahkan ke tong sampah. Data dapat dipulihkan kapan saja.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setConfirmDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executeDelete}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer">
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Permanen?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Data rak <strong className="text-red-600 dark:text-red-400">{confirmForceDelete.name}</strong> akan dihapus <span className="font-black text-red-600">PERMANEN</span> dari database.
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setConfirmForceDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executeForceDelete}
                                className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer">
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
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus {selectedIds.length} Rak Terpilih?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Semua rak yang dicentang akan dipindahkan ke tong sampah secara bersamaan.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setConfirmBulkDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executeBulkDestroy}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer">
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
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pulihkan {selectedIds.length} Rak Terpilih?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Semua rak yang dicentang akan dipulihkan ke daftar aktif.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setConfirmBulkRestore(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executeBulkRestore}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer">
                                Ya, Pulihkan Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
