import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import SalesFilter from './SalesFilter';
import SalesTable from './SalesTable';
import ReceiptModal from './ReceiptModal';
import ConfirmModal from './ConfirmModal';

export default function Index({ sales, isTrash }) {
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
        let routeName = '';
        let method = 'delete';

        if (actionType === 'delete') {
            title = 'Pindahkan Terpilih ke Sampah?';
            message = `Anda akan memindahkan ${selectedIds.length} transaksi terpilih ke sampah.`;
            routeName = 'sales.destroy';
        } else if (actionType === 'restore') {
            title = 'Pulihkan Terpilih?';
            message = `Pulihkan ${selectedIds.length} transaksi terpilih kembali ke aktif.`;
            routeName = 'sales.restore';
            method = 'post';
        } else if (actionType === 'force-delete') {
            title = 'Hapus Permanen Terpilih?';
            message = `PERINGATAN: ${selectedIds.length} transaksi akan dihapus permanen secara massal!`;
            routeName = 'sales.force-delete';
        }

        setConfirmModal({
            show: true,
            title,
            message,
            action: () => {
                selectedIds.forEach(id => {
                    if (method === 'post') {
                        router.post(route(routeName, id), {}, { preserveScroll: true });
                    } else {
                        router.delete(route(routeName, id), { preserveScroll: true });
                    }
                });
                setConfirmModal({ show: false });
                setSelectedIds([]);
            }
        });
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

        let printIframe = document.getElementById('receipt-print-iframe');
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'receipt-print-iframe';
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '0';
            printIframe.style.height = '0';
            printIframe.style.border = 'none';
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentWindow || printIframe.contentDocument.document || printIframe.contentDocument;
        iframeDoc.document.open();
        iframeDoc.document.write(`
            <html>
                <head>
                    <title>Cetak Struk Massal</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 58mm; margin: 0; padding: 5px; color: #000; }
                    </style>
                </head>
                <body>${combinedHtml}</body>
            </html>
        `);
        iframeDoc.document.close();
        
        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
        }, 300);
    };

    const executePrintSingle = () => {
        const printContents = document.getElementById('modal-printable-receipt').innerHTML;
        let printIframe = document.getElementById('receipt-print-iframe');
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'receipt-print-iframe';
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '0';
            printIframe.style.height = '0';
            printIframe.style.border = 'none';
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentWindow || printIframe.contentDocument.document || printIframe.contentDocument;
        iframeDoc.document.open();
        iframeDoc.document.write(`
            <html>
                <head>
                    <title>Cetak Struk</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 58mm; margin: 0; padding: 5px; color: #000; }
                    </style>
                </head>
                <body>${printContents}</body>
            </html>
        `);
        iframeDoc.document.close();
        
        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
        }, 300);
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
        </AuthenticatedLayout>
    );
}