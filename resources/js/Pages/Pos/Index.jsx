import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Impor Komponen Anak
import ProductList from './Components/ProductList';
import CartSidebar from './Components/CartSidebar';
import PrescriptionModal from './Components/PrescriptionModal';
import SimulationModal from './Components/SimulationModal';
import ReceiptModal from './Components/ReceiptModal';

export default function Index({ medicines }) {
    // === STATE UTAMA ===
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dbMedicines, setDbMedicines] = useState(medicines || []);
    const [payments, setPayments] = useState({ cash: 0, qris: 0, transfer: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    // === STATE MODAL & RESEP ===
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [simulationType, setSimulationType] = useState('');
    const [completedSale, setCompletedSale] = useState(null);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
    const [prescriptionNumber, setPrescriptionNumber] = useState('');
    const [prescriptionError, setPrescriptionError] = useState('');
    const [isFetchingPrescription, setIsFetchingPrescription] = useState(false);

    const [activePrescriptionId, setActivePrescriptionId] = useState(null);

    // === PERHITUNGAN & FILTER ===
    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setDbMedicines(medicines || []);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get('/api/pos/medicines', { params: { q: searchQuery } });
                setDbMedicines(res.data);
            } catch (error) {
                console.error("Gagal mengambil data obat", error);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, medicines]);

    const filteredMedicines = dbMedicines;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPaid = (payments.cash || 0) + (payments.qris || 0) + (payments.transfer || 0);
    const changeAmount = totalPaid - subtotal;

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

    const removeFromCart = (id) => setCart(cart.filter(item => item.medicine_id !== id));

    const handlePullPrescription = async () => {
        if (!prescriptionNumber) return;
        setIsFetchingPrescription(true);
        setPrescriptionError('');

        try {
            const response = await axios.get(`/api/prescriptions/${prescriptionNumber}`);
            const data = response.data;

            setActivePrescriptionId(data.id);

            const newCartItems = data.items.map(item => ({
                medicine_id: item.medicine_id,
                name: item.medicine.name,
                sku: item.medicine.sku,
                base_unit: item.medicine.base_unit,
                quantity: item.quantity,
                price: Number(item.medicine.selling_price),
                max_stock: item.medicine.stock || 999,
                signa: item.signa
            }));

            setCart([...cart, ...newCartItems]);
            setIsPrescriptionModalOpen(false);
            setPrescriptionNumber('');
        } catch (error) {
            setPrescriptionError(error.response?.data?.message || 'Gagal menarik resep. Pastikan nomor benar.');
        } finally {
            setIsFetchingPrescription(false);
        }
    };

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
            prescription_id: activePrescriptionId,
        }, {
            onSuccess: (page) => {
                setCompletedSale({
                    invoice_number: page.props.flash?.invoice_number || 'INV-SUCCESS',
                    date: new Date().toLocaleString('id-ID'),
                    items: currentCartSnapshot,
                    subtotal: currentTotal,
                    paid: currentPaid,
                    change: currentChange,
                    method: currentMethod
                });

                setCart([]);
                setActivePrescriptionId(null);
                setPayments({ cash: 0, qris: 0, transfer: 0 });
                setSearchQuery('');
                setIsProcessing(false);
                setShowSimulationModal(false);
            },
            onError: () => {
                setIsProcessing(false);
                setShowSimulationModal(false);
            }
        });
    };

    const handlePrintReceipt = () => {
        const printContents = document.getElementById('printable-receipt').innerHTML;
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0px';
        printIframe.style.height = '0px';
        printIframe.style.border = 'none';

        document.body.appendChild(printIframe);

        const iframeDoc = printIframe.contentWindow || printIframe.contentDocument.document || printIframe.contentDocument;
        iframeDoc.document.open();
        iframeDoc.document.write(`
            <html>
                <head>
                    <title>Cetak Struk</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; width: 58mm; margin: 0; padding: 5px; color: #000; }
                        .text-center { text-align: center; }
                        .flex { display: flex; justify-content: space-between; }
                        .font-bold { font-weight: bold; }
                        .border-b { border-bottom: 1px dashed #000; }
                        .pb-3 { padding-bottom: 8px; }
                        .py-3 { padding-top: 8px; padding-bottom: 8px; }
                        .mt-1 { margin-top: 4px; }
                        .text-\\[10px\\] { font-size: 10px; }
                    </style>
                </head>
                <body>${printContents}</body>
            </html>
        `);
        iframeDoc.document.close();
        
        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();

            printIframe.contentWindow.onafterprint = () => {
                if (document.body.contains(printIframe)) {
                    document.body.removeChild(printIframe);
                }
            };
            setTimeout(() => {
                if (document.body.contains(printIframe)) {
                    document.body.removeChild(printIframe);
                }
            }, 2000);
        }, 300);
    };

    return (
        <AuthenticatedLayout header="Point of Sales (Kasir)">
            <Head title="Kasir - Penjualan" />

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
                {/* KOMPONEN KIRI */}
                <ProductList 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filteredMedicines={filteredMedicines}
                    addToCart={addToCart}
                    setIsPrescriptionModalOpen={setIsPrescriptionModalOpen}
                />

                {/* KOMPONEN KANAN */}
                <CartSidebar 
                    cart={cart}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                    subtotal={subtotal}
                    payments={payments}
                    setPayments={setPayments}
                    totalPaid={totalPaid}
                    changeAmount={changeAmount}
                    handleProceedCheckout={handleProceedCheckout}
                    isProcessing={isProcessing}
                    formatRupiah={formatRupiah}
                />
            </div>

            {/* KOMPONEN MODAL */}
            <PrescriptionModal 
                isOpen={isPrescriptionModalOpen}
                onClose={() => setIsPrescriptionModalOpen(false)}
                prescriptionNumber={prescriptionNumber}
                setPrescriptionNumber={setPrescriptionNumber}
                prescriptionError={prescriptionError}
                setPrescriptionError={setPrescriptionError}
                isFetchingPrescription={isFetchingPrescription}
                handlePullPrescription={handlePullPrescription}
            />

            <SimulationModal 
                isOpen={showSimulationModal}
                onClose={() => setShowSimulationModal(false)}
                simulationType={simulationType}
                payments={payments}
                formatRupiah={formatRupiah}
                executeFinalCheckout={executeFinalCheckout}
                isProcessing={isProcessing}
            />

            <ReceiptModal 
                sale={completedSale}
                onClose={() => setCompletedSale(null)}
                onPrint={handlePrintReceipt}
                formatRupiah={formatRupiah}
            />
        </AuthenticatedLayout>
    );
}