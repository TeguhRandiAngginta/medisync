import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';

import { extractPurchaseInvoice, generateInvoiceSummaryNote } from './Components/PurchaseAiService';
import PurchaseHeaderCard from './Components/PurchaseHeaderCard';
import PurchaseItemsTable from './Components/PurchaseItemsTable';
import PurchaseModals from './Components/PurchaseModals';

export default function Create({ suppliers, medicines, supplierTypes = [], categories = [], racks = [] }) {
    const [supplierList, setSupplierList] = useState(suppliers || []);
    const [medicineList, setMedicineList] = useState(medicines || []);
    const [isScanning, setIsScanning] = useState(false);
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: '', type: 'success' });

    // State Deteksi Supplier Belum Terdaftar & Modal Quick Add Supplier
    const [unregisteredSupplier, setUnregisteredSupplier] = useState(null);
    const [isQuickAddSupplierModalOpen, setIsQuickAddSupplierModalOpen] = useState(false);
    const [quickSupplierForm, setQuickSupplierForm] = useState({
        supplier_type_id: '',
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });
    const [isSavingSupplier, setIsSavingSupplier] = useState(false);

    // State Modal Quick Add Obat Baru
    const [isQuickAddMedicineModalOpen, setIsQuickAddMedicineModalOpen] = useState(false);
    const [targetItemIndex, setTargetItemIndex] = useState(null);
    const [quickMedicineForm, setQuickMedicineForm] = useState({
        name: '',
        generic_name: '',
        sku: '',
        barcode: '',
        medicine_category_id: '',
        supplier_id: '',
        rack_id: '',
        dosage_form: '',
        dosage_strength: '',
        requires_prescription: false,
        base_unit: '',
        selling_price: '',
        min_stock: 0,
        max_stock: '',
        is_active: true
    });
    const [isSavingMedicine, setIsSavingMedicine] = useState(false);

    const generateReceiptNo = () => {
        const date = new Date();
        const ymd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
        const timeSlug = date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') + date.getSeconds().toString().padStart(2, '0');
        const rnd = Math.floor(100 + Math.random() * 900);
        return `RCV-${ymd}-${timeSlug}-${rnd}`;
    };

    const { data, setData, post, processing, errors } = useForm({
        internal_receipt_number: generateReceiptNo(),
        invoice_number: '',
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        total_amount: 0,
        attachment: null,
        items: [
            { medicine_id: '', batch_number: '', expired_date: '', quantity: 1, uom: 'Tablet', purchase_price: 0, subtotal: 0 }
        ],
    });

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const addItem = () => {
        setData('items', [
            ...data.items, 
            { medicine_id: '', batch_number: '', expired_date: '', quantity: 1, uom: 'Tablet', purchase_price: 0, subtotal: 0 }
        ]);
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        setData({ ...data, items: newItems, total_amount: total });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        
        if (field === 'medicine_id') {
            const selectedMed = medicineList.find(m => m.id == value);
            if (selectedMed) newItems[index].uom = selectedMed.base_unit || 'Tablet';
        }
        
        if (field === 'quantity' || field === 'purchase_price' || field === 'medicine_id') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].purchase_price) || 0;
            newItems[index].subtotal = qty * price;
        }
        
        const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        setData({ ...data, items: newItems, total_amount: total });
    };

    const handleFileSelected = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setData('attachment', file);
        setPreviewUrl(URL.createObjectURL(file));
        setUnregisteredSupplier(null);
        setAlertInfo({ show: true, message: `File "${file.name}" berhasil dilampirkan. Klik "Ekstrak dengan AI" untuk memindai.`, type: 'success' });
    };

    const handleScanAI = (e) => {
        e.preventDefault();
        const file = data.attachment;

        if (!file) {
            setAlertInfo({ show: true, message: 'Harap pilih file gambar nota faktur PBF terlebih dahulu!', type: 'error' });
            return;
        }

        setIsScanning(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64String = reader.result.split(',')[1];
                const { data: parsedData, fromCache } = await extractPurchaseInvoice(base64String, file.type);

                processAiResult(parsedData);
                setAlertInfo({ 
                    show: true, 
                    message: fromCache 
                        ? '⚡ Gambar yang sama terdeteksi! Data faktur dimuat instan dari Cache Lokal (0 Kuota AI terpakai).'
                        : 'Faktur PBF berhasil diekstrak oleh AI dan disimpan ke cache lokal!', 
                    type: 'success' 
                });
            } catch (error) {
                setAlertInfo({ show: true, message: `Gagal memproses faktur: ${error.message}`, type: 'error' });
            } finally {
                setIsScanning(false);
            }
        };
    };

    const processAiResult = (parsedData) => {
        let matchedSupplierId = '';
        let similarSupplier = null;
        const rawSupplier = (parsedData.supplier_name || '').trim();
        const rawAddress = (parsedData.supplier_address || '').trim();

        if (rawSupplier) {
            const normalize = (str) => str.toLowerCase().replace(/\b(pt|cv|tbk|persero)\b\.?/g, '').replace(/[^a-z0-9]/g, '');
            const cleanTarget = normalize(rawSupplier);
            const exactSup = supplierList.find(s => normalize(s.name) === cleanTarget);

            if (exactSup) {
                matchedSupplierId = exactSup.id;
                setUnregisteredSupplier(null);
            } else {
                similarSupplier = supplierList.find(s => {
                    const cleanSup = normalize(s.name);
                    return cleanSup.includes(cleanTarget) || 
                            cleanTarget.includes(cleanSup) ||
                            (cleanTarget.length >= 6 && cleanSup.slice(0, 6) === cleanTarget.slice(0, 6));
                }) || null;

                setUnregisteredSupplier({ name: rawSupplier, address: rawAddress, similarSupplier });
            }
        } else {
            setUnregisteredSupplier(null);
        }

        let newItems = [];
        if (parsedData.items && parsedData.items.length > 0) {
            newItems = parsedData.items.map(aiItem => {
                const searchName = (aiItem.medicine_name || '').toLowerCase();
                const firstWord = searchName.split(' ')[0];
                const foundMed = medicineList.find(m => 
                    m.name.toLowerCase().includes(searchName) || 
                    (firstWord.length >= 4 && m.name.toLowerCase().includes(firstWord))
                );
                
                const qty = parseInt(aiItem.quantity) || 1;
                const price = parseFloat(aiItem.purchase_price) || 0;

                return {
                    medicine_id: foundMed ? foundMed.id : '',
                    raw_name: aiItem.medicine_name || '',
                    batch_number: aiItem.batch_number || 'BATCH-AI',
                    expired_date: aiItem.expired_date || new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
                    quantity: qty,
                    uom: aiItem.uom || (foundMed ? foundMed.base_unit : 'Tablet'),
                    purchase_price: price,
                    subtotal: qty * price
                };
            });
        }

        const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);

        setData(prev => ({
            ...prev,
            supplier_id: matchedSupplierId || '',
            invoice_number: parsedData.invoice_number || prev.invoice_number,
            purchase_date: parsedData.purchase_date || prev.purchase_date,
            items: newItems.length > 0 ? newItems : prev.items,
            total_amount: newItems.length > 0 ? total : prev.total_amount
        }));
    };

    // HANDLER QUICK ADD SUPPLIER
    const openQuickAddSupplierModal = () => {
        if (!unregisteredSupplier) return;
        const defaultType = supplierTypes[0];
        const randomNum = Math.floor(100 + Math.random() * 900);

        setQuickSupplierForm({
            supplier_type_id: defaultType ? defaultType.id : '',
            code: defaultType ? `${defaultType.prefix_code}-${randomNum}` : '',
            name: unregisteredSupplier.name,
            contact_person: '',
            phone: '',
            email: '',
            address: unregisteredSupplier.address || ''
        });
        setIsQuickAddSupplierModalOpen(true);
    };

    const handleSaveQuickSupplier = async (e) => {
        e.preventDefault();
        setIsSavingSupplier(true);
        try {
            const res = await axios.post(route('api.suppliers.quick-store'), quickSupplierForm);
            const newSupplier = res.data.supplier;

            setSupplierList(prev => [newSupplier, ...prev]);
            setData('supplier_id', newSupplier.id);
            setUnregisteredSupplier(null);
            setIsQuickAddSupplierModalOpen(false);
            setAlertInfo({ show: true, message: res.data.message, type: 'success' });
        } catch (error) {
            setAlertInfo({ show: true, message: error.response?.data?.message || 'Gagal mendaftarkan supplier baru.', type: 'error' });
        } finally {
            setIsSavingSupplier(false);
        }
    };

    // HANDLER QUICK ADD OBAT BARU KE KATALOG
    const openQuickAddMedicineModal = (index, item) => {
        setTargetItemIndex(index);
        const suggestedPrice = item.purchase_price > 0 ? Math.ceil((item.purchase_price * 1.2) / 500) * 500 : '';

        setQuickMedicineForm({
            name: item.raw_name || '',
            generic_name: '',
            sku: '',
            barcode: '',
            medicine_category_id: categories[0]?.id || '',
            supplier_id: data.supplier_id || '',
            rack_id: '',
            dosage_form: '',
            dosage_strength: '',
            requires_prescription: false,
            base_unit: item.uom || 'Tablet',
            selling_price: suggestedPrice,
            min_stock: 5,
            max_stock: '',
            is_active: true
        });
        setIsQuickAddMedicineModalOpen(true);
    };

    const handleSaveQuickMedicine = async (e) => {
        e.preventDefault();
        setIsSavingMedicine(true);
        try {
            const res = await axios.post(route('api.products.quick-store'), quickMedicineForm);
            const newMed = res.data.medicine;

            setMedicineList(prev => [newMed, ...prev]);

            if (targetItemIndex !== null) {
                const updatedItems = [...data.items];
                updatedItems[targetItemIndex].medicine_id = newMed.id;
                updatedItems[targetItemIndex].uom = newMed.base_unit || updatedItems[targetItemIndex].uom;
                setData('items', updatedItems);
            }

            setIsQuickAddMedicineModalOpen(false);
            setAlertInfo({ show: true, message: res.data.message, type: 'success' });
        } catch (error) {
            setAlertInfo({ show: true, message: error.response?.data?.message || 'Gagal menyimpan obat ke katalog.', type: 'error' });
        } finally {
            setIsSavingMedicine(false);
        }
    };

    const handleGenerateAutoNotes = async () => {
        const validItems = data.items.filter(i => i.medicine_id || i.raw_name);
        if (validItems.length === 0) {
            setAlertInfo({ show: true, message: 'Belum ada rincian obat untuk dirangkum!', type: 'error' });
            return;
        }

        setIsGeneratingNote(true);
        try {
            const supplierObj = supplierList.find(s => s.id == data.supplier_id);
            const supplierText = supplierObj ? supplierObj.name : (unregisteredSupplier?.name || 'Supplier PBF');
            const itemSummaries = validItems.map((item, idx) => {
                const medObj = medicineList.find(m => m.id == item.medicine_id);
                const medName = medObj ? medObj.name : `${item.raw_name || 'Obat Baru'} [Belum di Master]`;
                return `${idx + 1}. ${medName} — ${item.quantity} ${item.uom} (Batch: ${item.batch_number || '-'}, Exp: ${item.expired_date || '-'})`;
            });

            const summaryText = await generateInvoiceSummaryNote({
                supplierText,
                invoiceText: data.invoice_number || '-',
                purchaseDate: data.purchase_date,
                itemSummaries,
                totalFormatted: formatRupiah(data.total_amount)
            });

            setData('notes', summaryText);
            setAlertInfo({ show: true, message: 'Ringkasan catatan faktur berhasil dibuat otomatis!', type: 'success' });
        } catch (error) {
            setAlertInfo({ show: true, message: 'Gagal membuat ringkasan otomatis.', type: 'error' });
        } finally {
            setIsGeneratingNote(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('purchases.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout header="Catat Pembelian & Barang Masuk">
            <Head title="Faktur Masuk" />

            <div className="max-w-7xl mx-auto pb-12 space-y-6">
                {alertInfo.show && (
                    <div className={`p-4 rounded-2xl text-xs font-bold flex justify-between items-center ${alertInfo.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                        <span>{alertInfo.message}</span>
                        <button onClick={() => setAlertInfo({ ...alertInfo, show: false })} className="font-bold px-2 py-1 cursor-pointer">✕</button>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <PurchaseHeaderCard
                        data={data}
                        setData={setData}
                        errors={errors}
                        supplierList={supplierList}
                        isScanning={isScanning}
                        previewUrl={previewUrl}
                        onFileSelected={handleFileSelected}
                        onScanAI={handleScanAI}
                        onOpenPreview={() => setIsPreviewModalOpen(true)}
                        unregisteredSupplier={unregisteredSupplier}
                        setUnregisteredSupplier={setUnregisteredSupplier}
                        onOpenQuickAddSupplierModal={openQuickAddSupplierModal}
                    />

                    <PurchaseItemsTable
                        data={data}
                        setData={setData}
                        errors={errors}
                        medicineList={medicineList}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                        onItemChange={handleItemChange}
                        onOpenQuickAddMedicineModal={openQuickAddMedicineModal}
                        isGeneratingNote={isGeneratingNote}
                        onGenerateAutoNotes={handleGenerateAutoNotes}
                        formatRupiah={formatRupiah}
                        processing={processing}
                    />
                </form>
            </div>

            <PurchaseModals
                isQuickAddSupplierModalOpen={isQuickAddSupplierModalOpen}
                onCloseQuickAddSupplierModal={() => setIsQuickAddSupplierModalOpen(false)}
                quickSupplierForm={quickSupplierForm}
                setQuickSupplierForm={setQuickSupplierForm}
                supplierTypes={supplierTypes}
                onSaveQuickSupplier={handleSaveQuickSupplier}
                isSavingSupplier={isSavingSupplier}
                isQuickAddMedicineModalOpen={isQuickAddMedicineModalOpen}
                onCloseQuickAddMedicineModal={() => setIsQuickAddMedicineModalOpen(false)}
                quickMedicineForm={quickMedicineForm}
                setQuickMedicineForm={setQuickMedicineForm}
                categories={categories}
                supplierList={supplierList}
                racks={racks}
                onSaveQuickMedicine={handleSaveQuickMedicine}
                isSavingMedicine={isSavingMedicine}
                isPreviewModalOpen={isPreviewModalOpen}
                onClosePreviewModal={() => setIsPreviewModalOpen(false)}
                previewUrl={previewUrl}
            />
        </AuthenticatedLayout>
    );
}