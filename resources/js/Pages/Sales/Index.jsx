import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import SalesFilter from './SalesFilter';
import SalesTable from './SalesTable';
import ReceiptModal from './ReceiptModal';
import ConfirmModal from './ConfirmModal';

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const RestoreIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const PrintIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

export default function Index({ sales, isTrash = false, trashed = false, trashedCount = 0, canManage = true, filters = {} }) {
    const activeTrash = Boolean(isTrash || trashed);
    const { errors } = usePage().props;
    const [authErrorModal, setAuthErrorModal] = useState(false);

    useEffect(() => {
        if (errors?.authorization || errors?.error) {
            setAuthErrorModal(true);
        }
    }, [errors]);

    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterType, setFilterType] = useState(filters?.filter || 'all');
    const [customDate, setCustomDate] = useState(filters?.date || '');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', action: null });

    useEffect(() => {
        setFilterType(filters?.filter || 'all');
        setCustomDate(filters?.date || '');
    }, [filters?.filter, filters?.date]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    const switchTab = (toTrash) => {
        setSelectedIds([]);
        router.get(
            route('sales.history'),
            toTrash ? { trashed: true } : {},
            { preserveScroll: true, replace: true }
        );
    };

    const handleFilterTypeChange = (newType) => {
        setFilterType(newType);
        setSelectedIds([]);
        if (newType !== 'custom') {
            router.get(
                route('sales.history'),
                { filter: newType, ...(activeTrash ? { trashed: true } : {}) },
                { preserveState: true, replace: true }
            );
        }
    };

    const handleCustomDateChange = (newDate) => {
        setCustomDate(newDate);
        setSelectedIds([]);
        if (newDate) {
            router.get(
                route('sales.history'),
                { filter: 'custom', date: newDate, ...(activeTrash ? { trashed: true } : {}) },
                { preserveState: true, replace: true }
            );
        }
    };

    const filteredSales = sales?.data || [];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredSales.map((sale) => sale.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Pindahkan ke Sampah?',
            message: 'Apakah Anda yakin ingin memindahkan transaksi penjualan ini ke sampah?',
            action: () =>
                router.delete(route('sales.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmModal({ show: false });
                        setSelectedIds([]);
                    },
                }),
        });
    };

    const handleRestore = (id) => {
        setConfirmModal({
            show: true,
            title: 'Pulihkan Transaksi?',
            message: 'Pulihkan transaksi ini kembali ke daftar riwayat penjualan aktif?',
            action: () =>
                router.post(
                    route('sales.restore', id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setConfirmModal({ show: false });
                            setSelectedIds([]);
                        },
                    }
                ),
        });
    };

    const handleForceDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Permanen?',
            message: 'Transaksi akan dihapus secara permanen dari database dan tidak dapat dikembalikan.',
            action: () =>
                router.delete(route('sales.force-delete', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setConfirmModal({ show: false });
                        setSelectedIds([]);
                    },
                }),
        });
    };

    const handleBulkAction = (actionType) => {
        if (selectedIds.length === 0) return;

        let title = '';
        let message = '';
        let actionCallback = null;

        if (actionType === 'delete') {
            title = `Hapus ${selectedIds.length} Transaksi Terpilih?`;
            message = `Semua ${selectedIds.length} transaksi yang dicentang akan dipindahkan ke tong sampah.`;
            actionCallback = () => {
                router.post(
                    route('sales.bulk-destroy'),
                    { ids: selectedIds },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setConfirmModal({ show: false });
                            setSelectedIds([]);
                        },
                    }
                );
            };
        } else if (actionType === 'restore') {
            title = `Pulihkan ${selectedIds.length} Transaksi Terpilih?`;
            message = `Pulihkan ${selectedIds.length} transaksi terpilih kembali ke daftar aktif.`;
            actionCallback = () => {
                router.post(
                    route('sales.bulk-restore'),
                    { ids: selectedIds },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setConfirmModal({ show: false });
                            setSelectedIds([]);
                        },
                    }
                );
            };
        } else if (actionType === 'force-delete') {
            title = `Hapus Permanen ${selectedIds.length} Transaksi?`;
            message = `${selectedIds.length} transaksi terpilih akan dihapus permanen dari database dan tidak dapat dibatalkan.`;
            actionCallback = () => {
                router.post(
                    route('sales.bulk-force-delete'),
                    { ids: selectedIds },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setConfirmModal({ show: false });
                            setSelectedIds([]);
                        },
                    }
                );
            };
        }

        setConfirmModal({
            show: true,
            title,
            message,
            action: actionCallback,
        });
    };

    const printHtmlContent = (htmlContent, title = 'Cetak Struk') => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        iframeDoc.document.open();
        iframeDoc.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 58mm; margin: 0; padding: 5px; color: #000; }
                    </style>
                </head>
                <body>${htmlContent}</body>
            </html>
        `);
        iframeDoc.document.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            iframe.contentWindow.onafterprint = () => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            };

            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 2000);
        }, 300);
    };

    const handleBulkPrint = () => {
        if (selectedIds.length === 0) return;
        const salesToPrint = filteredSales.filter((sale) => selectedIds.includes(sale.id));

        let combinedHtml = '';
        salesToPrint.forEach((sale) => {
            let itemsHtml = (sale.details || [])
                .map(
                    (i) => `
                <div style="display: flex; justify-content: space-between;">
                    <div>${i.medicine?.name || 'Obat'} (${i.quantity}x)</div>
                    <div>${formatRupiah(i.subtotal)}</div>
                </div>
            `
                )
                .join('');

            combinedHtml += `
                <div style="page-break-after: always; margin-bottom: 20px;">
                    <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
                        <div style="font-weight: bold; font-size: 13px;">APOTEK MEDISYNC</div>
                        <div>Nota: ${sale.invoice_number}</div>
                        <div>${new Date(sale.sale_date).toLocaleString('id-ID')}</div>
                        <div>Kasir: ${sale.user?.name || 'Admin'}</div>
                    </div>
                    <div style="margin-bottom: 8px;">${itemsHtml}</div>
                    <div style="border-top: 1px dashed #000; padding-top: 8px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Total:</span> <span>${formatRupiah(sale.total_amount)}</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Metode:</span> <span>${sale.payment_method}</span></div>
                    </div>
                    <div style="text-align: center; font-size: 10px;">TERIMA KASIH - LEKAS SEMBUH KEMBALI</div>
                </div>
            `;
        });

        printHtmlContent(combinedHtml, 'Cetak Struk Massal');
    };

    const executePrintSingle = () => {
        const printContents = document.getElementById('modal-printable-receipt')?.innerHTML || '';
        if (printContents) {
            printHtmlContent(printContents, 'Cetak Struk');
        }
    };

    return (
        <AuthenticatedLayout header="Riwayat Penjualan">
            <Head title={activeTrash ? 'Trash - Riwayat Penjualan' : 'Riwayat Penjualan'} />

            {/* Header & Action Bar Seragam */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                        {activeTrash ? 'Keranjang Sampah Penjualan (Trash)' : 'Daftar Transaksi Kasir'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {activeTrash
                            ? 'Daftar transaksi penjualan yang dipindahkan ke trash. Pulihkan data atau hapus secara permanen.'
                            : 'Kelola riwayat transaksi kasir, filter periode tanggal, cetak ulang struk, dan aksi massal.'}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Print */}
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkPrint}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#48CFA4] hover:bg-[#3bb890] text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-sm"
                        >
                            <PrintIcon />
                            <span>Cetak ({selectedIds.length})</span>
                        </button>
                    )}

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && activeTrash && (
                        <>
                            <button
                                onClick={() => handleBulkAction('restore')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-blue-600/20"
                            >
                                <RestoreIcon />
                                <span>Pulihkan ({selectedIds.length})</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('force-delete')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                            >
                                <TrashIcon />
                                <span>Hapus Permanen ({selectedIds.length})</span>
                            </button>
                        </>
                    )}

                    {selectedIds.length > 0 && !activeTrash && (
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                        >
                            <TrashIcon />
                            <span>Hapus ({selectedIds.length})</span>
                        </button>
                    )}

                    {/* Tab Toggle Pill (trash hanya untuk superadmin/owner) */}
                    {canManage && <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => switchTab(false)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                !activeTrash
                                    ? 'bg-[#48CFA4] text-white dark:bg-[#253939] dark:text-[#67E2B4]'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            Data Aktif
                        </button>
                        <button
                            onClick={() => switchTab(true)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                                activeTrash
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            <TrashIcon />
                            <span>Trash</span>
                            {trashedCount > 0 && (
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        activeTrash
                                            ? 'bg-white/20 text-white'
                                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                    }`}
                                >
                                    {trashedCount}
                                </span>
                            )}
                        </button>
                    </div>}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {!activeTrash && (
                    <SalesFilter
                        filterType={filterType}
                        setFilterType={handleFilterTypeChange}
                        customDate={customDate}
                        setCustomDate={handleCustomDateChange}
                    />
                )}

                <SalesTable
                    sales={filteredSales}
                    isTrash={activeTrash}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onPrint={(sale) => setSelectedSale(sale)}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onForceDelete={handleForceDelete}
                />
            </div>

            {sales?.links && sales.links.length > 3 && (
                <div className="mt-6 flex justify-center gap-1">
                    {sales.links.map((link, idx) => (
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

            <ConfirmModal
                isOpen={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                onClose={() => setConfirmModal({ show: false })}
                onConfirm={confirmModal.action}
            />

            <ReceiptModal
                selectedSale={selectedSale}
                onClose={() => setSelectedSale(null)}
                onPrint={executePrintSingle}
            />

            {/* MODAL PERINGATAN AKSES DITOLAK */}
            {authErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white dark:bg-[#1E272E] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative">
                        <button
                            onClick={() => setAuthErrorModal(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors cursor-pointer"
                            title="Tutup"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Akses Ditolak (403)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {errors?.authorization || errors?.error || 'Hanya Owner atau Superadmin yang memiliki hak akses untuk mengubah riwayat transaksi.'}
                        </p>

                        <button
                            onClick={() => setAuthErrorModal(false)}
                            className="w-full py-3 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#48CFA4]/20 transition-all cursor-pointer"
                        >
                            Tutup / Mengerti
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}