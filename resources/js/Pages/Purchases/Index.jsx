import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Index({ purchases }) {
    const { flash } = usePage().props;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [activePurchaseToPrint, setActivePurchaseToPrint] = useState(null);

    // STATE BARU: Modal Rincian Detail Item Pembelian
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activePurchaseForDetail, setActivePurchaseForDetail] = useState(null);

    // STATE: Untuk pengelolaan pilihan checkbox (bulk delete)
    const [selectedIds, setSelectedIds] = useState([]);
    const [confirmingBulkDeletion, setConfirmingBulkDeletion] = useState(false);

    useEffect(() => {
        if (flash?.print_url) {
        }
    }, [flash]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    // Fungsi Pilih Semua Checkbox
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(purchases.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Fungsi Pilih Satuan Checkbox
    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const confirmDelete = (purchase) => {
        setSelectedPurchase(purchase);
        setConfirmingDeletion(true);
    };

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

    // Fungsi Hapus Massal (Bulk Delete)
    const deleteBulkPurchases = () => {
        router.post(route('purchases.bulk-destroy'), { ids: selectedIds }, {
            onSuccess: () => {
                setConfirmingBulkDeletion(false);
                setSelectedIds([]);
            },
        });
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">Selesai</span>;
            case 'draft': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider">Draft</span>;
            case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider">Batal</span>;
            default: return status || <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">Selesai</span>;
        }
    };

    const handleOpenPrintModal = (purchase) => {
        setActivePurchaseToPrint(purchase);
        setPrintModalOpen(true);
    };

    const handleOpenDetailModal = (purchase) => {
        setActivePurchaseForDetail(purchase);
        setDetailModalOpen(true);
    };

    return (
        <AuthenticatedLayout header="Pembelian & Barang Masuk">
            <Head title="Data Pembelian" />

            {/* HEADER & KELOMPOK TOMBOL AKSI */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Riwayat Faktur Pembelian</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Kelola data pembelian dan pantau masa kedaluwarsa obat.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Tombol Hapus Massal */}
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={() => setConfirmingBulkDeletion(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 shadow-md shadow-red-600/20 font-bold text-xs tracking-wide cursor-pointer animate-in fade-in"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <span>Hapus ({selectedIds.length})</span>
                        </button>
                    )}

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
                        href={route('purchases.trash')}
                        title="Lihat Tong Sampah"
                        className="p-2.5 bg-gray-50 dark:bg-[#151E24] text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700/60 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </Link>

                    <Link 
                        href={route('purchases.create')} 
                        title="Catat Faktur Baru"
                        className="p-2.5 bg-[#48CFA4] text-white hover:bg-[#3bb890] rounded-md transition-colors shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] flex items-center justify-center cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-4 py-4 w-10 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll}
                                    checked={purchases.length > 0 && selectedIds.length === purchases.length}
                                    className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                />
                            </th>
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
                                <td colSpan="7" className="px-6 py-16 text-center text-gray-400">Belum ada data faktur pembelian.</td>
                            </tr>
                        ) : (
                            purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-4 py-5 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(purchase.id)}
                                            onChange={() => handleSelectOne(purchase.id)}
                                            className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5 font-bold text-[#48CFA4]">
                                        {purchase.invoice_number}
                                        <span className="block text-[10px] text-gray-400 font-normal">Internal: {purchase.internal_receipt_number}</span>
                                    </td>
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
                                            {/* TOMBOL LIHAT DETAIL ITEM OBAT */}
                                            <button 
                                                onClick={() => handleOpenDetailModal(purchase)} 
                                                title="Lihat Detail Item Obat"
                                                className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl hover:bg-[#48CFA4] hover:text-white transition-colors cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>

                                            {/* TOMBOL CETAK BPB / PDF */}
                                            <button 
                                                onClick={() => handleOpenPrintModal(purchase)} 
                                                title="Cetak BPB"
                                                className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                            </button>

                                            {/* TOMBOL HAPUS */}
                                            <button 
                                                onClick={() => confirmDelete(purchase)}
                                                title="Hapus Faktur"
                                                className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
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

            {/* MODAL POP-UP RINCIAN ITEM OBAT FAKTUR */}
            {detailModalOpen && activePurchaseForDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white dark:bg-[#1E272E] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div>
                                <span className="px-3 py-1 bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    Item Obat Terdaftar
                                </span>
                                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg mt-1 font-mono">
                                    {activePurchaseForDetail.invoice_number}
                                </h3>
                                <p className="text-xs text-gray-400">Supplier: {activePurchaseForDetail.supplier?.name || '-'}</p>
                            </div>
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* TABEL ITEM OBAT */}
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#151E24] text-gray-500 font-bold uppercase">
                                        <th className="p-3">Nama Obat</th>
                                        <th className="p-3">No. Batch</th>
                                        <th className="p-3">Expired Date</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Harga Beli</th>
                                        <th className="p-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                                    {activePurchaseForDetail.details && activePurchaseForDetail.details.length > 0 ? (
                                        activePurchaseForDetail.details.map((detail) => (
                                            <tr key={detail.id}>
                                                <td className="p-3 font-bold text-gray-800 dark:text-gray-200">
                                                    {detail.medicine?.name || 'Obat Dihapus'}
                                                </td>
                                                <td className="p-3 font-mono text-[#48CFA4]">{detail.batch_number}</td>
                                                <td className="p-3">{detail.expired_date}</td>
                                                <td className="p-3 text-center font-bold">{detail.quantity}</td>
                                                <td className="p-3 text-right">{formatRupiah(detail.purchase_price)}</td>
                                                <td className="p-3 text-right font-bold text-emerald-500">
                                                    {formatRupiah(detail.subtotal)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-4 text-center text-gray-400 italic">
                                                Tidak ada rincian item obat.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                            <span className="text-xs text-gray-400 font-bold">Total Nilai Pembelian:</span>
                            <span className="text-lg font-black text-emerald-500">{formatRupiah(activePurchaseForDetail.total_amount)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS SATUAN */}
            {confirmingDeletion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Faktur Pembelian?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Anda akan menghapus faktur <strong className="text-gray-800 dark:text-gray-200">{selectedPurchase?.invoice_number}</strong>. Stok obat di POS akan otomatis terkurangi.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingDeletion(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={deletePurchase}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS MASSAL (BULK DELETE) */}
            {confirmingBulkDeletion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus {selectedIds.length} Faktur Terpilih?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Semua faktur pembelian yang dicentang akan dipindahkan ke tong sampah secara bersamaan dan stok POS dikurangi.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setConfirmingBulkDeletion(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={deleteBulkPurchases}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PRATINJAU & CETAK DOKUMEN */}
            {printModalOpen && activePurchaseToPrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-[#1E272E] p-6 md:p-7 rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-100 dark:border-gray-800 flex flex-col my-auto">
                        
                        <div className="flex justify-between items-center pb-4 mb-3 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <span className="px-3 py-1 bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    Pratinjau Dokumen BPB
                                </span>
                                <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 mt-1 font-mono">
                                    {activePurchaseToPrint.invoice_number}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setPrintModalOpen(false)}
                                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="w-full h-[62vh] bg-gray-100 dark:bg-[#151E24] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                            <iframe 
                                id="pdf-print-iframe"
                                src={route('purchases.print', activePurchaseToPrint.id)} 
                                className="w-full h-full border-0"
                                title="Pratinjau PDF BPB"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400 font-mono">
                                No. Sistem: <span className="font-bold">{activePurchaseToPrint.internal_receipt_number}</span>
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setPrintModalOpen(false)}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                >
                                    Tutup
                                </button>

                                <button 
                                    onClick={() => {
                                        const iframe = document.getElementById('pdf-print-iframe');
                                        if (iframe && iframe.contentWindow) {
                                            iframe.contentWindow.print();
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-[#48CFA4] text-white rounded-2xl text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#48CFA4]/20 flex items-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                    Cetak Dokumen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}