import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Trash({ purchases }) {
    const [confirmingRestore, setConfirmingRestore] = useState(false);
    const [confirmingForceDelete, setConfirmingForceDelete] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const confirmRestore = (purchase) => {
        setSelectedPurchase(purchase);
        setConfirmingRestore(true);
    };

    const restorePurchase = () => {
        if (selectedPurchase) {
            router.post(route('purchases.restore', selectedPurchase.id), {}, {
                onSuccess: () => {
                    setConfirmingRestore(false);
                    setSelectedPurchase(null);
                },
            });
        }
    };

    const confirmForceDelete = (purchase) => {
        setSelectedPurchase(purchase);
        setConfirmingForceDelete(true);
    };

    const forceDeletePurchase = () => {
        if (selectedPurchase) {
            router.delete(route('purchases.force-delete', selectedPurchase.id), {
                onSuccess: () => {
                    setConfirmingForceDelete(false);
                    setSelectedPurchase(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Pembelian & Barang Masuk">
            <Head title="Keranjang Sampah Pembelian" />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span>🗑️</span> Keranjang Sampah (Recycle Bin)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Data faktur yang dihapus akan masuk ke sini. Pulihkan atau hapus permanen.</p>
                </div>

                <Link 
                    href={route('purchases.index')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700/60 font-bold text-xs tracking-wide cursor-pointer shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span>Kembali ke Data Aktif</span>
                </Link>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">No. Faktur PBF</th>
                            <th className="px-6 py-4 font-bold">Waktu Dihapus</th>
                            <th className="px-6 py-4 font-bold">Supplier</th>
                            <th className="px-6 py-4 font-bold text-right">Total Nilai (Rp)</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi Manajemen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!purchases || purchases.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center text-gray-400">Keranjang sampah kosong.</td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5 font-bold text-[#48CFA4]">{purchase.invoice_number}</td>
                                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs font-mono">{purchase.deleted_at}</td>
                                    <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{purchase.supplier?.name || '-'}</td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-gray-700 dark:text-gray-200">
                                        {formatRupiah(purchase.total_amount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Tombol Pulihkan (Restore) dengan Ikon SVG */}
                                            <button 
                                                onClick={() => confirmRestore(purchase)}
                                                title="Pulihkan Faktur"
                                                className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                                </svg>
                                            </button>

                                            {/* Tombol Hapus Permanen (Force Delete) dengan Ikon SVG */}
                                            <button 
                                                onClick={() => confirmForceDelete(purchase)}
                                                title="Hapus Permanen"
                                                className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL KONFIRMASI PULIHKAN */}
            {confirmingRestore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pulihkan Faktur Pembelian?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Faktur <strong className="text-gray-800 dark:text-gray-200">{selectedPurchase?.invoice_number}</strong> akan dikembalikan ke data aktif sistem.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingRestore(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={restorePurchase}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30 cursor-pointer"
                            >
                                Ya, Pulihkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS PERMANEN */}
            {confirmingForceDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Permanen Faktur?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Faktur <strong className="text-gray-800 dark:text-gray-200">{selectedPurchase?.invoice_number}</strong> akan dimusnahkan secara permanen dari database dan tidak dapat dikembalikan lagi.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingForceDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={forceDeletePurchase}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
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