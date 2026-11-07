import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import SalesFilter from './SalesFilter';
import SalesTable from './SalesTable';
import ReceiptModal from './ReceiptModal';
import ConfirmModal from './ConfirmModal';

export default function Index({ sales, isTrash }) {
    const { errors } = usePage().props;
    const [authErrorModal, setAuthErrorModal] = useState(false);
    useEffect(() => {
        if (errors?.authorization || errors?.error) {
            setAuthErrorModal(true);
        }
    }, [errors]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [customDate, setCustomDate] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', action: null });

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    const filteredSales = useMemo(() => {
        if (!sales?.data) return [];
        if (filterType === 'all') return sales.data;

        const today = new Date().toISOString().slice(0, 10);
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().slice(0, 10);

        return sales.data.filter(sale => {
            const saleDateOnly = sale.sale_date.slice(0, 10);
            if (filterType === 'today') return saleDateOnly === today;
            if (filterType === 'yesterday') return saleDateOnly === yesterday;
            if (filterType === 'custom' && customDate) return saleDateOnly === customDate;
            return true;
        });
    }, [sales, filterType, customDate]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredSales.map(sale => sale.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Pindahkan ke Sampah?',
            message: 'Apakah Anda yakin ingin memindahkan transaksi penjualan ini ke sampah?',
            action: () => router.delete(route('sales.destroy', id), {
                onSuccess: () => { setConfirmModal({ show: false }); setSelectedIds([]); }
            })
        });
    };

    const handleRestore = (id) => {
        setConfirmModal({
            show: true,
            title: 'Pulihkan Transaksi?',
            message: 'Pulihkan transaksi ini kembali ke daftar riwayat penjualan aktif?',
            action: () => router.post(route('sales.restore', id), {}, {
                onSuccess: () => { setConfirmModal({ show: false }); setSelectedIds([]); }
            })
        });
    };

    const handleForceDelete = (id) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Permanen?',
            message: 'PERINGATAN: Transaksi akan dihapus secara permanen dari database dan tidak dapat dikembalikan!',
            action: () => router.delete(route('sales.force-delete', id), {
                onSuccess: () => { setConfirmModal({ show: false }); setSelectedIds([]); }
            })
        });
    };

    const handleBulkAction = (actionType) => {
        if (selectedIds.length === 0) return;

        let title = '';
        let message = '';
        let actionCallback = null;

        if (actionType === 'delete') {
            title = 'Pindahkan Terpilih ke Sampah?';
            message = `Anda akan memindahkan ${selectedIds.length} transaksi terpilih ke sampah.`;
            actionCallback = () => {
                router.post(route('sales.bulk-destroy'), { ids: selectedIds }, {
                    onSuccess: () => {
                        setConfirmModal({ show: false });
                        setSelectedIds([]);
                    }
                });
            };
        } else if (actionType === 'restore') {
            title = 'Pulihkan Terpilih?';
            message = `Pulihkan ${selectedIds.length} transaksi terpilih kembali ke aktif.`;
            actionCallback = () => {
                router.post(route('sales.bulk-restore'), { ids: selectedIds }, {
                    onSuccess: () => {
                        setConfirmModal({ show: false });
                        setSelectedIds([]);
                    }
                });
            };
        } else if (actionType === 'force-delete') {
            title = 'Hapus Permanen Terpilih?';
            message = `PERINGATAN: ${selectedIds.length} transaksi akan dihapus permanen secara massal!`;
            actionCallback = () => {
                selectedIds.forEach(id => {
                    router.delete(route('sales.force-delete', id), { preserveScroll: true });
                });
                setConfirmModal({ show: false });
                setSelectedIds([]);
            };
        }

        setConfirmModal({
            show: true,
            title,
            message,
            action: actionCallback
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
        const salesToPrint = filteredSales.filter(sale => selectedIds.includes(sale.id));
        
        let combinedHtml = '';
        salesToPrint.forEach(sale => {
            let itemsHtml = sale.details.map(i => `
                <div style="display: flex; justify-content: space-between;">
                    <div>${i.medicine?.name || 'Obat'} (${i.quantity}x)</div>
                    <div>${formatRupiah(i.subtotal)}</div>
                </div>
            `).join('');

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
            <Head title="Riwayat Penjualan" />

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <SalesFilter 
                    isTrash={isTrash}
                    selectedIds={selectedIds}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    customDate={customDate}
                    setCustomDate={setCustomDate}
                    onBulkPrint={handleBulkPrint}
                    onBulkAction={handleBulkAction}
                />

                <SalesTable 
                    sales={filteredSales}
                    isTrash={isTrash}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onPrint={(sale) => setSelectedSale(sale)}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onForceDelete={handleForceDelete}
                />
            </div>

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
                        
                        {/* TOMBOL TUTUP SVG */}
                        <button 
                            onClick={() => setAuthErrorModal(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors cursor-pointer"
                            title="Tutup"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        {/* IKON PERINGATAN SVG */}
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
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