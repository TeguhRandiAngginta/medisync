import React, { useState } from 'react';
import PhoneInput from '@/Components/PhoneInput';
import BarcodeScannerModal from '@/Components/BarcodeScannerModal';

const MEDISYNC_BTN_CLASS = "px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none cursor-pointer";

export default function PurchaseModals({
    // Modal Supplier
    isQuickAddSupplierModalOpen,
    onCloseQuickAddSupplierModal,
    quickSupplierForm,
    setQuickSupplierForm,
    supplierTypes = [],
    onSaveQuickSupplier,
    isSavingSupplier,

    // Modal Obat Baru
    isQuickAddMedicineModalOpen,
    onCloseQuickAddMedicineModal,
    quickMedicineForm,
    setQuickMedicineForm,
    categories = [],
    supplierList = [],
    racks = [],
    onSaveQuickMedicine,
    isSavingMedicine,

    // Modal Preview
    isPreviewModalOpen,
    onClosePreviewModal,
    previewUrl
}) {
    const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

    const handleSupplierTypeChange = (e) => {
        const typeId = e.target.value;
        const selected = supplierTypes.find(t => t.id == typeId);
        if (selected) {
            const randomNum = Math.floor(100 + Math.random() * 900);
            setQuickSupplierForm(prev => ({
                ...prev,
                supplier_type_id: typeId,
                code: `${selected.prefix_code}-${randomNum}`
            }));
        } else {
            setQuickSupplierForm(prev => ({ ...prev, supplier_type_id: typeId }));
        }
    };

    return (
        <>
            {/* MODAL TAMBAH SUPPLIER BARU */}
            {isQuickAddSupplierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 max-w-3xl w-full my-8">
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Perusahaan (Tambah Supplier Baru)</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan detail lengkap pemasok atau pabrik farmasi.</p>
                            </div>
                            <button type="button" onClick={onCloseQuickAddSupplierModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={onSaveQuickSupplier} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipe Pemasok (Referensi) <span className="text-red-500">*</span></label>
                                    <select 
                                        value={quickSupplierForm.supplier_type_id} 
                                        onChange={handleSupplierTypeChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                                    >
                                        <option value="">-- Pilih Tipe Pemasok --</option>
                                        {supplierTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} ({type.prefix_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kode Pemasok <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={quickSupplierForm.code} 
                                        onChange={e => setQuickSupplierForm({ ...quickSupplierForm, code: e.target.value })} 
                                        required 
                                        placeholder="Pilih Tipe Pemasok Dulu"
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#11181C] border-transparent rounded-xl font-mono font-bold text-[#48CFA4] uppercase" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Perusahaan <span className="text-red-500">*</span></label>
                                    <input type="text" value={quickSupplierForm.name} onChange={e => setQuickSupplierForm({ ...quickSupplierForm, name: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kontak Person</label>
                                    <input type="text" value={quickSupplierForm.contact_person} onChange={e => setQuickSupplierForm({ ...quickSupplierForm, contact_person: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                                    <PhoneInput value={quickSupplierForm.phone} onChange={(value) => setQuickSupplierForm({ ...quickSupplierForm, phone: value })} />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Email</label>
                                    <input type="email" value={quickSupplierForm.email} onChange={e => setQuickSupplierForm({ ...quickSupplierForm, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
                                    <textarea value={quickSupplierForm.address} onChange={e => setQuickSupplierForm({ ...quickSupplierForm, address: e.target.value })} rows="2" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button type="button" onClick={onCloseQuickAddSupplierModal} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSavingSupplier} className={MEDISYNC_BTN_CLASS}>
                                    {isSavingSupplier ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. MODAL TAMBAH OBAT BARU KE KATALOG (DENGAN SCAN BARCODE KAMERA) */}
            {isQuickAddMedicineModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
                    <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                        
                        {/* HEADER MODAL */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-100">Informasi Master Obat (Tambah Obat Baru)</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pastikan data medis yang dimasukkan akurat sesuai kemasan pabrik.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={onCloseQuickAddMedicineModal} 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 font-bold text-base transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* FORM WRAPPER */}
                        <form onSubmit={onSaveQuickMedicine} className="flex flex-col flex-1 overflow-hidden">
                            
                            {/* BODY FORM */}
                            <div className="p-5 space-y-3.5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                
                                {/* SEKSI 1: IDENTITAS OBAT */}
                                <div className="bg-gray-50/70 dark:bg-[#151E24]/80 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-3.5 bg-[#48CFA4] rounded-full"></span> Identitas Obat
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Nama Obat <span className="text-red-500">*</span></label>
                                            <input type="text" required value={quickMedicineForm.name} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, name: e.target.value })} placeholder="Misal: Panadol Extra" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Nama Generik (Kandungan)</label>
                                            <input type="text" value={quickMedicineForm.generic_name} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, generic_name: e.target.value })} placeholder="Paracetamol 500mg" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">SKU (Kode Internal)</label>
                                            <input type="text" value={quickMedicineForm.sku} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, sku: e.target.value })} placeholder="AUTO-GENERATE" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono uppercase text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Barcode Pabrik</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={quickMedicineForm.barcode} 
                                                    onChange={e => setQuickMedicineForm({ ...quickMedicineForm, barcode: e.target.value })} 
                                                    placeholder="Ketik atau scan..." 
                                                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsBarcodeScannerOpen(true)}
                                                    className="absolute right-1.5 top-1 p-1 text-gray-400 hover:text-[#48CFA4] bg-gray-50 dark:bg-[#151E24] rounded-md border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                                                    title="Scan via Kamera"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                        <circle cx="12" cy="13" r="4"></circle>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SEKSI 2: KLASIFIKASI & PENYIMPANAN */}
                                <div className="bg-gray-50/70 dark:bg-[#151E24]/80 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-3.5 bg-sky-400 rounded-full"></span> Klasifikasi & Penyimpanan
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Golongan Obat <span className="text-red-500">*</span></label>
                                            <select required value={quickMedicineForm.medicine_category_id} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, medicine_category_id: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]">
                                                <option value="">-- Pilih Golongan --</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Pemasok Utama (Opsional)</label>
                                            <select value={quickMedicineForm.supplier_id} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, supplier_id: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]">
                                                <option value="">-- Pilih Supplier --</option>
                                                {supplierList.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Lokasi Rak Fisik</label>
                                            <select value={quickMedicineForm.rack_id} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, rack_id: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]">
                                                <option value="">-- Pilih Lokasi --</option>
                                                {racks.map(r => <option key={r.id} value={r.id}>{r.code} - {r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col justify-center gap-1.5 bg-white dark:bg-[#1E272E] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                                <input type="checkbox" checked={quickMedicineForm.requires_prescription} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, requires_prescription: e.target.checked })} className="rounded text-[#48CFA4] focus:ring-[#48CFA4]" />
                                                Wajib Resep Dokter
                                            </label>
                                            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                                <input type="checkbox" checked={quickMedicineForm.is_active} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, is_active: e.target.checked })} className="rounded text-[#48CFA4] focus:ring-[#48CFA4]" />
                                                Status Jual Aktif
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* SEKSI 3: SPESIFIKASI, HARGA & STOK */}
                                <div className="bg-gray-50/70 dark:bg-[#151E24]/80 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-3.5 bg-[#F6A84B] rounded-full"></span> Spesifikasi, Harga & Stok
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Bentuk Sediaan</label>
                                            <input type="text" value={quickMedicineForm.dosage_form} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, dosage_form: e.target.value })} placeholder="Tablet, Sirup" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Kekuatan Dosis</label>
                                            <input type="text" value={quickMedicineForm.dosage_strength} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, dosage_strength: e.target.value })} placeholder="500mg, 60ml" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Satuan Terkecil <span className="text-red-500">*</span></label>
                                            <input type="text" required value={quickMedicineForm.base_unit} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, base_unit: e.target.value })} placeholder="Strip, Botol" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Harga Jual (HJA) <span className="text-red-500">*</span></label>
                                            <input type="number" min="0" required value={quickMedicineForm.selling_price} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, selling_price: e.target.value })} placeholder="15000" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 font-mono font-bold focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Batas Min. Stok <span className="text-red-500">*</span></label>
                                            <input type="number" min="0" required value={quickMedicineForm.min_stock} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, min_stock: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">Batas Maks. Stok</label>
                                            <input type="number" min="0" value={quickMedicineForm.max_stock} onChange={e => setQuickMedicineForm({ ...quickMedicineForm, max_stock: e.target.value })} placeholder="Opsional" className="w-full px-3 py-2 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER TOMBOL TETAP */}
                            <div className="flex justify-end gap-3 px-6 py-3.5 bg-gray-50/90 dark:bg-[#151E24]/90 border-t border-gray-100 dark:border-gray-800 shrink-0">
                                <button type="button" onClick={onCloseQuickAddMedicineModal} className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSavingMedicine} className={MEDISYNC_BTN_CLASS}>
                                    {isSavingMedicine ? 'Menyimpan...' : 'Simpan Obat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SCANNER KAMERA BARCODE */}
            <BarcodeScannerModal 
                isOpen={isBarcodeScannerOpen} 
                onClose={() => setIsBarcodeScannerOpen(false)} 
                onScan={(code) => {
                    setQuickMedicineForm(prev => ({ ...prev, barcode: code }));
                    setIsBarcodeScannerOpen(false);
                }} 
            />

            {/* 3. MODAL PREVIEW NOTA / FAKTUR IN-APP */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-100">Preview Nota Faktur PBF</h3>
                            <button onClick={onClosePreviewModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg cursor-pointer">✕</button>
                        </div>
                        <div className="flex justify-center items-center bg-gray-50 dark:bg-[#151E24] rounded-2xl p-4 max-h-[60vh] overflow-auto">
                            {previewUrl && <img src={previewUrl} alt="Preview Faktur" className="max-h-[50vh] object-contain rounded-xl shadow-md" />}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={onClosePreviewModal} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-bold transition-colors cursor-pointer">
                                Tutup Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}