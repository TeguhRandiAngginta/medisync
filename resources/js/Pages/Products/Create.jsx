import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import BarcodeScannerModal from '@/Components/BarcodeScannerModal';

export default function Create({ categories, suppliers, racks }) {
    const { data, setData, post, processing, errors } = useForm({
        sku: '',
        barcode: '',
        name: '',
        generic_name: '',
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
    });
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <AuthenticatedLayout header="Tambah Obat Baru">
            <Head title="Tambah Obat" />

            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Master Obat</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pastikan data medis yang dimasukkan akurat sesuai kemasan pabrik.</p>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    
                    {/* BAGIAN 1: IDENTITAS PRODUK */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#48CFA4] rounded-full"></span> Identitas Obat
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Obat <span className="text-red-500">*</span></label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required placeholder="Misal: Panadol Extra" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100" />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Generik (Kandungan)</label>
                                <input type="text" value={data.generic_name} onChange={e => setData('generic_name', e.target.value)} placeholder="Misal: Paracetamol 500mg, Caffeine 65mg" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100" />
                                <InputError message={errors.generic_name} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">SKU (Kode Internal)</label>
                                <input type="text" value={data.sku} onChange={e => setData('sku', e.target.value)} placeholder="Kosongkan untuk Auto-Generate" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 uppercase" />
                                <InputError message={errors.sku} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Barcode Pabrik</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={data.barcode} 
                                        onChange={e => setData('barcode', e.target.value)} 
                                        placeholder="Ketik manual atau scan..." 
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 pr-12" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsScannerOpen(true)}
                                        className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-[#48CFA4] bg-white dark:bg-[#1E272E] rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
                                        title="Scan via Kamera"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                    </button>
                                </div>
                                <InputError message={errors.barcode} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* BAGIAN 2: KLASIFIKASI & PENYIMPANAN */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#6FD8E8] rounded-full"></span> Klasifikasi & Penyimpanan
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Golongan Obat <span className="text-red-500">*</span></label>
                                <select value={data.medicine_category_id} onChange={e => setData('medicine_category_id', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100">
                                    <option value="">-- Pilih Golongan --</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <InputError message={errors.medicine_category_id} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pemasok Utama (Opsional)</label>
                                <select value={data.supplier_id} onChange={e => setData('supplier_id', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100">
                                    <option value="">-- Pilih Supplier --</option>
                                    {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lokasi Rak Fisik</label>
                                <select value={data.rack_id} onChange={e => setData('rack_id', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100">
                                    <option value="">-- Pilih Lokasi --</option>
                                    {racks.map(rack => <option key={rack.id} value={rack.id}>{rack.name} ({rack.code})</option>)}
                                </select>
                            </div>
                            <div className="flex items-center mt-8">
                                <input type="checkbox" id="resep" checked={data.requires_prescription} onChange={e => setData('requires_prescription', e.target.checked)} className="w-5 h-5 text-[#48CFA4] bg-gray-100 border-gray-300 rounded focus:ring-[#48CFA4] dark:focus:ring-[#48CFA4] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="resep" className="ml-3 text-sm font-bold text-gray-900 dark:text-gray-300">Wajib Resep Dokter</label>
                            </div>
                        </div>
                    </div>

                    {/* SPESIFIKASI MEDIS, HARGA & STOK */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#F6A84B] rounded-full"></span> Spesifikasi, Harga & Stok
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bentuk Sediaan</label>
                                <input type="text" value={data.dosage_form} onChange={e => setData('dosage_form', e.target.value)} placeholder="Misal: Tablet, Sirup, Salep" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kekuatan Dosis</label>
                                <input type="text" value={data.dosage_strength} onChange={e => setData('dosage_strength', e.target.value)} placeholder="Misal: 500mg, 10ml" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Satuan Terkecil <span className="text-red-500">*</span></label>
                                <input type="text" value={data.base_unit} onChange={e => setData('base_unit', e.target.value)} required placeholder="Misal: Strip, Botol, Pcs" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100" />
                                <InputError message={errors.base_unit} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Harga Jual (HJA) <span className="text-red-500">*</span></label>
                                <input type="number" min="0" value={data.selling_price} onChange={e => setData('selling_price', e.target.value)} required placeholder="Misal: 15000" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-mono" />
                                <InputError message={errors.selling_price} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Batas Peringatan Stok <span className="text-red-500">*</span></label>
                                <input type="number" min="0" value={data.min_stock} onChange={e => setData('min_stock', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Batas Stok Maksimal</label>
                                <input type="number" min="0" value={data.max_stock} onChange={e => setData('max_stock', e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 pb-12">
                        <Link href={route('products.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">Batal</Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base">
                            {processing ? 'Menyimpan...' : 'Simpan Obat'}
                        </PrimaryButton>
                    </div>

                    <BarcodeScannerModal 
                        isOpen={isScannerOpen} 
                        onClose={() => setIsScannerOpen(false)} 
                        onScan={(code) => {
                            setData('barcode', code);
                            setIsScannerOpen(false);
                        }} 
                    />

                </form>
            </div>
        </AuthenticatedLayout>
    );
}