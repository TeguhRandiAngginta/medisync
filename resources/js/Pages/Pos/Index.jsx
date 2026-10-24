import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Index({ medicines }) {
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [payments, setPayments] = useState({ cash: 0, qris: 0, transfer: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [simulationType, setSimulationType] = useState('');
    const [completedSale, setCompletedSale] = useState(null);

    const filteredMedicines = useMemo(() => {
        return medicines.filter(medicine => 
            medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            medicine.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (medicine.barcode && medicine.barcode.includes(searchQuery))
        );
    }, [medicines, searchQuery]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    const addToCart = (medicine) => {
        const existingItem = cart.find(item => item.medicine_id === medicine.id);
        if (existingItem) {
            if (existingItem.quantity < medicine.stock) {
                setCart(cart.map(item => item.medicine_id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                alert(`Stok ${medicine.name} tidak mencukupi!`);
            }
        } else {
            if (medicine.stock > 0) {
                setCart([...cart, { 
                    medicine_id: medicine.id, name: medicine.name, sku: medicine.sku,
                    base_unit: medicine.base_unit, quantity: 1, 
                    price: Number(medicine.selling_price), max_stock: medicine.stock
                }]);
            } else {
                alert(`Stok ${medicine.name} kosong!`);
            }
        }
    };

    const updateQuantity = (id, newQuantity) => {
        const item = cart.find(i => i.medicine_id === id);
        if (!item || newQuantity < 1 || newQuantity > item.max_stock) return;
        setCart(cart.map(i => i.medicine_id === id ? { ...i, quantity: newQuantity } : i));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.medicine_id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPaid = (payments.cash || 0) + (payments.qris || 0) + (payments.transfer || 0);
    const changeAmount = totalPaid - subtotal;

    const handleProceedCheckout = () => {
        if (cart.length === 0 || changeAmount < 0) return;

        if ((payments.qris > 0 || payments.transfer > 0)) {
            setSimulationType(payments.qris > 0 && payments.transfer > 0 ? 'QRIS & Transfer' : (payments.qris > 0 ? 'QRIS' : 'Transfer'));
            setShowSimulationModal(true);
        } else {
            executeFinalCheckout();
        }
    };

    const executeFinalCheckout = () => {
        setIsProcessing(true);
        const usedMethods = [];
        if (payments.cash > 0) usedMethods.push('Cash');
        if (payments.qris > 0) usedMethods.push('QRIS');
        if (payments.transfer > 0) usedMethods.push('Transfer');

        const currentCartSnapshot = [...cart];
        const currentTotal = subtotal;
        const currentPaid = totalPaid;
        const currentChange = changeAmount;
        const currentMethod = usedMethods.join(' + ') || 'Cash';

        router.post(route('pos.store'), {
            cart: cart,
            paid_amount: totalPaid,
            change_amount: changeAmount >= 0 ? changeAmount : 0,
            payment_method: currentMethod,
        }, {
            onSuccess: (page) => {
                const invoice = page.props.flash?.invoice_number;
                
                setCompletedSale({
                    invoice_number: invoice || 'INV-SUCCESS',
                    date: new Date().toLocaleString('id-ID'),
                    items: currentCartSnapshot,
                    subtotal: currentTotal,
                    paid: currentPaid,
                    change: currentChange,
                    method: currentMethod
                });

                setCart([]);
                setPayments({ cash: 0, qris: 0, transfer: 0 });
                setSearchQuery('');
                setIsProcessing(false);
                setShowSimulationModal(false);
            },
            onError: () => setIsProcessing(false)
        });
    };

    const handlePrintReceipt = () => {
        const printContents = document.getElementById('printable-receipt').innerHTML;
        
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
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            font-size: 11px; 
                            width: 58mm; 
                            margin: 0; 
                            padding: 5px; 
                            color: #000; 
                        }
                        .text-center { text-align: center; }
                        .flex { display: flex; justify-content: space-between; }
                        .font-bold { font-weight: bold; }
                        .border-b { border-bottom: 1px dashed #000; }
                        .pb-3 { padding-bottom: 8px; }
                        .py-3 { padding-top: 8px; padding-bottom: 8px; }
                        .space-y-2 > * + * { margin-top: 4px; }
                        .space-y-1 > * + * { margin-top: 2px; }
                    </style>
                </head>
                <body>
                    ${printContents}
                </body>
            </html>
        `);
        iframeDoc.document.close();
        
        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
        }, 300);
    };

    return (
        <AuthenticatedLayout header="Point of Sales (Kasir)">
            <Head title="Kasir - Penjualan" />

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">

                {/* KIRI: PENCARIAN OBAT */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Scan Barcode atau ketik nama obat, SKU..." 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#151E24] border-none rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#48CFA4]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredMedicines.map((medicine) => (
                                <button 
                                    key={medicine.id}
                                    onClick={() => addToCart(medicine)}
                                    className="flex flex-col p-4 text-left border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#48CFA4] hover:bg-[#EAF5F0] dark:hover:bg-[#253939] transition-all group"
                                >
                                    <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#246A55] line-clamp-2">{medicine.name}</span>
                                    <span className="text-xs text-gray-500 mt-1">{medicine.sku}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KANAN: KERANJANG & SPLIT PAYMENT */}
                <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Keranjang Kasir</h3>
                        <span className="bg-[#48CFA4] text-white text-xs font-bold px-2 py-1 rounded-lg">{cart.length} Item</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <span>Keranjang kosong</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.medicine_id} className="flex flex-col p-3 border border-gray-100 dark:border-gray-800 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                                            <button onClick={() => removeFromCart(item.medicine_id)} className="text-red-400 hover:text-red-600">✕</button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-mono">{formatRupiah(item.price)}</span>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#151E24] p-1 rounded-lg">
                                                <button onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700">-</button>
                                                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700">+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-[#151E24] border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold border-b pb-2">
                            <span>Total Tagihan</span>
                            <span className="text-xl text-[#246A55] dark:text-[#67E2B4] font-mono">{formatRupiah(subtotal)}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-bold text-gray-500 w-16">Tunai</label>
                                <input type="number" min="0" value={payments.cash || ''} onChange={(e) => setPayments({...payments, cash: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border rounded-xl font-mono text-sm" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-bold text-gray-500 w-16">QRIS</label>
                                <input type="number" min="0" value={payments.qris || ''} onChange={(e) => setPayments({...payments, qris: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border rounded-xl font-mono text-sm" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-bold text-gray-500 w-16">Transfer</label>
                                <input type="number" min="0" value={payments.transfer || ''} onChange={(e) => setPayments({...payments, transfer: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border rounded-xl font-mono text-sm" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-2 border-t">
                            <span>Total Dibayar</span>
                            <span className="font-mono font-bold">{formatRupiah(totalPaid)}</span>
                        </div>

                        {totalPaid > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{changeAmount < 0 ? 'Kurang Bayar' : 'Kembalian'}</span>
                                <span className={`font-mono font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-[#48CFA4]'}`}>
                                    {formatRupiah(Math.abs(changeAmount))}
                                </span>
                            </div>
                        )}

                        <button 
                            onClick={handleProceedCheckout}
                            disabled={cart.length === 0 || changeAmount < 0 || isProcessing}
                            className="w-full py-3 font-extrabold rounded-xl bg-[#48CFA4] hover:bg-[#3AB890] text-white shadow-lg disabled:opacity-50"
                        >
                            {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                        </button>
                    </div>
                </div>

            </div>

            {/* MODAL SIMULASI PEMBAYARAN NON-TUNAI */}
            {showSimulationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center border dark:border-gray-800">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-1">Menunggu Pembayaran {simulationType}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Silakan verifikasi pembayaran non-tunai pelanggan sebesar <strong className="text-emerald-500">{formatRupiah(payments.qris + payments.transfer)}</strong></p>
                        
                        <div className="bg-gray-50 dark:bg-[#151E24] p-4 rounded-2xl mb-6 border border-dashed dark:border-gray-700">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Gateway Pembayaran Aktif</div>
                            <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">STATUS: MENUNGGU KONFIRMASI EDC</div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowSimulationModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm"
                            >
                                Batalkan
                            </button>
                            <button 
                                onClick={executeFinalCheckout}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {isProcessing ? 'Memproses...' : 'Konfirmasi Sukses'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL STRUK SUKSES INTERNAL */}
            {completedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white text-black p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 font-mono text-xs">
                        
                        <div id="printable-receipt" className="bg-white text-black p-2">
                            <div className="text-center pb-3 border-b border-dashed border-gray-400">
                                <div className="font-bold text-sm">APOTEK MEDISYNC</div>
                                <div>Nota: {completedSale.invoice_number}</div>
                                <div>{completedSale.date}</div>
                            </div>
                            
                            <div className="py-3 space-y-2 border-b border-dashed border-gray-400 max-h-48 overflow-y-auto">
                                {completedSale.items.map((i, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <div>{i.name} ({i.quantity}x)</div>
                                        <div>{formatRupiah(i.price * i.quantity)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="py-3 space-y-1 border-b border-dashed border-gray-400">
                                <div className="flex justify-between font-bold">
                                    <span>Total Tagihan:</span>
                                    <span>{formatRupiah(completedSale.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Metode Bayar:</span>
                                    <span>{completedSale.method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Dibayar:</span>
                                    <span>{formatRupiah(completedSale.paid)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kembalian:</span>
                                    <span>{formatRupiah(completedSale.change)}</span>
                                </div>
                            </div>

                            <div className="text-center py-3 text-[10px]">
                                TERIMA KASIH - LEKAS SEMBUH KEMBALI
                            </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        <div className="flex gap-2 pt-4 border-t mt-2">
                            <button 
                                onClick={() => setCompletedSale(null)}
                                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl font-sans font-bold flex items-center justify-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Tutup
                            </button>
                            <button 
                                onClick={handlePrintReceipt}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-sans font-bold shadow-md flex items-center justify-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}