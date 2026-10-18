import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Create({ suppliers, medicines }) {
    const generateReceiptNo = () => {
        const date = new Date();
        const ymd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
        const rnd = Math.floor(1000 + Math.random() * 9000);
        return `RCV-${ymd}-${rnd}`;
    };

    const { data, setData, post, processing, errors } = useForm({
        internal_receipt_number: generateReceiptNo(),
        invoice_number: '',
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        total_amount: 0,
        items: [
            { medicine_id: '', batch_number: '', expired_date: '', quantity: 1, uom: 'Tablet', purchase_price: 0, subtotal: 0 }
        ],
    });

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
            const selectedMed = medicines.find(m => m.id == value);
            if (selectedMed) {
                newItems[index].uom = selectedMed.base_unit || 'Tablet';
            }
        }
        
        if (field === 'quantity' || field === 'purchase_price' || field === 'medicine_id') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].purchase_price) || 0;
            newItems[index].subtotal = qty * price;
        }
        
        const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        setData({ ...data, items: newItems, total_amount: total });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('purchases.store'));
    };

    return (
        <AuthenticatedLayout header="Catat Pembelian & Barang Masuk">
            <Head title="Faktur Masuk" />

            <div className="max-w-7xl mx-auto pb-12">
                <form onSubmit={submit} className="space-y-6">
                    
                    {/* KARTU HEADER DOKUMEN */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <span className="w-2.5 h-6 bg-[#48CFA4] rounded-full"></span> Informasi Dokumen Pembelian (PBF)
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">Nomor sistem dibuat otomatis, sesuaikan data fisik dari faktur distributor.</p>
                            </div>
                            <span className="px-3 py-1 bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] rounded-full text-xs font-bold uppercase tracking-wider">
                                Modul Gudang
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">No. Sistem (Internal)</label>
                                <input type="text" value={data.internal_receipt_number} disabled className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 font-mono font-bold cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">No. Faktur PBF Asli <span className="text-red-500">*</span></label>
                                <input type="text" value={data.invoice_number} onChange={e => setData('invoice_number', e.target.value)} required placeholder="Cth: INV/2026/001" className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 uppercase font-bold" />
                                <InputError message={errors.invoice_number} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Pilih Supplier PBF <span className="text-red-500">*</span></label>
                                <select value={data.supplier_id} onChange={e => setData('supplier_id', e.target.value)} required className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 font-medium">
                                    <option value="">-- Pilih Supplier --</option>
                                    {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                </select>
                                <InputError message={errors.supplier_id} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Tanggal di Faktur <span className="text-red-500">*</span></label>
                                <input type="date" value={data.purchase_date} onChange={e => setData('purchase_date', e.target.value)} required className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 font-medium" />
                                <InputError message={errors.purchase_date} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* KARTU RINCIAN OBAT */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <span className="w-2.5 h-6 bg-[#F6A84B] rounded-full"></span> Rincian Item Obat Masuk
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">Masukkan nomor batch dan tanggal kadaluarsa sesuai fisik kemasan pabrik.</p>
                            </div>
                            <button type="button" onClick={addItem} className="px-5 py-2.5 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-2xl text-xs font-extrabold hover:bg-[#48CFA4] hover:text-white transition-all shadow-sm flex items-center gap-2">
                                + Tambah Baris Obat
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto pb-2">
                            <table className="w-full text-sm text-left min-w-[950px]">
                                <thead className="text-[11px] text-gray-400 dark:text-gray-400 uppercase bg-gray-50/70 dark:bg-[#151E24] tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3.5 rounded-l-xl w-[26%]">Pilih Obat Master</th>
                                        <th className="px-4 py-3.5 w-[16%]">No. Batch Pabrik</th>
                                        <th className="px-4 py-3.5 w-[16%]">Expired Date</th>
                                        <th className="px-4 py-3.5 w-[18%] text-center">Jumlah & Satuan</th>
                                        <th className="px-4 py-3.5 w-[14%]">Harga Beli</th>
                                        <th className="px-4 py-3.5 w-[10%] text-right">Subtotal</th>
                                        <th className="px-2 py-3.5 rounded-r-xl text-center w-12">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {data.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                                            <td className="px-2 py-3">
                                                <select value={item.medicine_id} onChange={e => handleItemChange(index, 'medicine_id', e.target.value)} required className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium">
                                                    <option value="">-- Cari Obat --</option>
                                                    {medicines.map(med => <option key={med.id} value={med.id}>{med.sku} — {med.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="text" value={item.batch_number} onChange={e => handleItemChange(index, 'batch_number', e.target.value)} required placeholder="Cth: BATCH001" className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 uppercase font-mono" />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="date" value={item.expired_date} onChange={e => handleItemChange(index, 'expired_date', e.target.value)} required className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium" />
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="flex gap-2">
                                                    <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="w-16 text-xs text-center px-2 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-bold" />
                                                    <select value={item.uom} onChange={e => handleItemChange(index, 'uom', e.target.value)} className="w-full text-xs px-2 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium">
                                                        <option value="Tablet">Tablet</option>
                                                        <option value="Strip">Strip</option>
                                                        <option value="Box">Box</option>
                                                        <option value="Botol">Botol</option>
                                                        <option value="Ampul">Ampul</option>
                                                        <option value="Pcs">Pcs</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs">Rp</span>
                                                    <input type="number" min="0" value={item.purchase_price} onChange={e => handleItemChange(index, 'purchase_price', e.target.value)} required className="w-full text-xs pl-8 pr-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-mono font-bold" />
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-right font-mono font-bold text-[#48CFA4]">
                                                {formatRupiah(item.subtotal)}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <button type="button" onClick={() => removeItem(index)} disabled={data.items.length === 1} className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* CATATAN & TOTAL KESELURUHAN */}
                        <div className="mt-8 flex flex-col md:flex-row justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div className="w-full md:w-1/2 mb-6 md:mb-0">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Catatan Keterangan Faktur</label>
                                <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows="3" className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 text-sm" placeholder="Tuliskan catatan khusus atau diskon dari distributor jika ada..."></textarea>
                            </div>
                            
                            <div className="text-right w-full md:w-auto bg-gray-50 dark:bg-[#151E24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-1">Total Nilai Faktur:</p>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-6 font-mono">
                                    {formatRupiah(data.total_amount)}
                                </h2>
                                
                                <div className="flex justify-end gap-3">
                                    <Link href={route('purchases.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Batal</Link>
                                    <PrimaryButton type="submit" disabled={processing || data.items.length === 0} className="px-8 py-3 text-sm shadow-lg shadow-[#48CFA4]/20 rounded-2xl">
                                        {processing ? 'Menyimpan...' : 'Simpan & Cetak BPB'}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}