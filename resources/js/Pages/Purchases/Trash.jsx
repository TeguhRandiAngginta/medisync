import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function Trash({ purchases }) {
    const [confirmingAction, setConfirmingAction] = useState({ isOpen: false, type: '', purchase: null });

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const confirmRestore = (purchase) => {
        setConfirmingAction({ isOpen: true, type: 'restore', purchase });
    };

    const confirmForceDelete = (purchase) => {
        setConfirmingAction({ isOpen: true, type: 'force-delete', purchase });
    };

    const executeAction = () => {
        const { type, purchase } = confirmingAction;
        if (!purchase) return;

        if (type === 'restore') {
            router.post(route('purchases.restore', purchase.id), {}, {
                onSuccess: () => setConfirmingAction({ isOpen: false, type: '', purchase: null })
            });
        } else if (type === 'force-delete') {
            router.delete(route('purchases.force-delete', purchase.id), {
                onSuccess: () => setConfirmingAction({ isOpen: false, type: '', purchase: null })
            });
        }
    };

    return (
        <AuthenticatedLayout header="Keranjang Sampah Pembelian">
            <Head title="Trash - Data Pembelian" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Keranjang Sampah (Recycle Bin)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data faktur yang dihapus akan masuk ke sini. Pulihkan atau hapus permanen.</p>
                </div>
                <Link href={route('purchases.index')} className="px-5 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Kembali ke Data Aktif
                </Link>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-red-50/50 dark:bg-[#151E24] border-b border-red-100 dark:border-red-900/30 tracking-wider">
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
                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400 flex flex-col items-center justify-center">
                                    <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                    Keranjang sampah kosong.
                                </td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors opacity-80 hover:opacity-100">
                                    <td className="px-6 py-5 font-bold text-gray-600 dark:text-gray-400 line-through">{purchase.invoice_number}</td>
                                    <td className="px-6 py-5 text-red-500 font-medium">
                                        {new Date(purchase.deleted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-5 font-bold text-gray-700 dark:text-gray-300">{purchase.supplier?.name || '-'}</td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-gray-600 dark:text-gray-400">
                                        {formatRupiah(purchase.total_amount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => confirmRestore(purchase)}
                                                className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition-colors"
                                            >
                                                Pulihkan
                                            </button>
                                            <button 
                                                onClick={() => confirmForceDelete(purchase)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                Hapus Permanen
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {confirmingAction.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0 ${confirmingAction.type === 'restore' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                            {confirmingAction.type === 'restore' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            )}
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            {confirmingAction.type === 'restore' ? 'Pulihkan Faktur Pembelian?' : 'Hapus Secara Permanen?'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {confirmingAction.type === 'restore' 
                                ? `Faktur ${confirmingAction.purchase?.invoice_number} akan dikembalikan ke data aktif dan dapat diakses kembali.`
                                : `Faktur ${confirmingAction.purchase?.invoice_number} beserta detail obatnya akan DILENYAPKAN dari sistem dan TIDAK BISA dikembalikan lagi.`
                            }
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingAction({ isOpen: false, type: '', purchase: null })}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeAction}
                                className={`px-6 py-2.5 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg ${confirmingAction.type === 'restore' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
                            >
                                {confirmingAction.type === 'restore' ? 'Ya, Pulihkan' : 'Musnahkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}