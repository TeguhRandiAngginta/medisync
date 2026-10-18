import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { useEffect, useState } from 'react';

export default function Index({ purchases }) {
    const { flash } = usePage().props;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    useEffect(() => {
        if (flash?.print_url) {
            window.open(flash.print_url, '_blank');
        }
    }, [flash]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    // Buka modal konfirmasi hapus kustom
    const confirmDelete = (purchase) => {
        setSelectedPurchase(purchase);
        setConfirmingDeletion(true);
    };

    // Eksekusi hapus setelah dikonfirmasi via modal
    const deletePurchase = () => {
        if (selectedPurchase) {
            router.delete(route('purchases.destroy', selectedPurchase.id), {
                onSuccess: () => {
                    setConfirmingDeletion(false);
                    setSelectedPurchase(null);
                },
            });
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">Selesai</span>;
            case 'draft': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider">Draft</span>;
            case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider">Batal</span>;
            default: return status;
        }
    };

    return (
        <AuthenticatedLayout header="Pembelian & Barang Masuk">
            <Head title="Data Pembelian" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Faktur Pembelian</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pencatatan faktur supplier, nomor batch, dan expired date.</p>
                </div>
                <PrimaryButton as="link" href={route('purchases.create')}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Catat Faktur Baru
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">No. Faktur PBF</th>
                            <th className="px-6 py-4 font-bold">Tanggal</th>
                            <th className="px-6 py-4 font-bold">Supplier</th>
                            <th className="px-6 py-4 font-bold text-right">Total Nilai (Rp)</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!purchases || purchases.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-400">Belum ada data faktur pembelian.</td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5 font-bold text-[#48CFA4]">{purchase.invoice_number}</td>
                                    <td className="px-6 py-5 text-gray-700 dark:text-gray-200">{purchase.purchase_date}</td>
                                    <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{purchase.supplier?.name || '-'}</td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-gray-700 dark:text-gray-200">
                                        {formatRupiah(purchase.total_amount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {getStatusBadge(purchase.status)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <a 
                                                href={route('purchases.print', purchase.id)} 
                                                target="_blank" 
                                                title="Cetak BPB"
                                                className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                            </a>
                                            <button 
                                                onClick={() => confirmDelete(purchase)}
                                                title="Hapus Faktur"
                                                className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL KONFIRMASI HAPUS KUSTOM */}
            {confirmingDeletion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        
                        {/* Perbaikan ukuran dan pembungkus ikon */}
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Faktur Pembelian?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Anda akan menghapus faktur <strong className="text-gray-800 dark:text-gray-200">{selectedPurchase?.invoice_number}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingDeletion(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={deletePurchase}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}