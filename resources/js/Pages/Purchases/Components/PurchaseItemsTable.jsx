import React from 'react';
import { Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';

const MEDISYNC_BTN_CLASS = "px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none cursor-pointer";

export default function PurchaseItemsTable({
    data,
    setData,
    errors,
    medicineList,
    onAddItem,
    onRemoveItem,
    onItemChange,
    onOpenQuickAddMedicineModal,
    isGeneratingNote,
    onGenerateAutoNotes,
    formatRupiah,
    processing
}) {
    return (
        <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#F6A84B] rounded-full"></span> Rincian Item Obat Masuk
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Masukkan nomor batch dan tanggal kadaluarsa (minimal 6 bulan ke depan dari hari ini).</p>
                </div>
                <button type="button" onClick={onAddItem} className={MEDISYNC_BTN_CLASS}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Tambah Baris Obat
                </button>
            </div>
            
            <div className="overflow-x-auto pb-2">
                <table className="w-full text-sm text-left min-w-[950px]">
                    <thead className="text-[11px] text-gray-400 dark:text-gray-400 uppercase bg-gray-50/70 dark:bg-[#151E24] tracking-wider">
                        <tr>
                            <th className="px-4 py-3.5 rounded-l-xl w-[26%]">Pilih Obat Master</th>
                            <th className="px-4 py-3.5 w-[16%]">No. Batch Pabrik</th>
                            <th className="px-4 py-3.5 w-[16%]">Expired Date (Min. 6 Bln)</th>
                            <th className="px-4 py-3.5 w-[18%] text-center">Jumlah & Satuan</th>
                            <th className="px-4 py-3.5 w-[14%]">Harga Beli</th>
                            <th className="px-4 py-3.5 w-[10%] text-right">Subtotal</th>
                            <th className="px-2 py-3.5 rounded-r-xl text-center w-12">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {data.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors align-top">
                                <td className="px-2 py-3">
                                    <select value={item.medicine_id} onChange={e => onItemChange(index, 'medicine_id', e.target.value)} required className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium">
                                        <option value="">-- Cari Obat --</option>
                                        {medicineList.map(med => <option key={med.id} value={med.id}>{med.sku} — {med.name}</option>)}
                                    </select>
                                    
                                    {/* TOMBOL TAMBAH KE KATALOG JIKA OBAT BELUM TERDAFTAR */}
                                    {!item.medicine_id && (
                                        <div className="mt-1.5 flex flex-col gap-1">
                                            {item.raw_name && (
                                                <span className="text-[10px] text-amber-500 font-semibold block">
                                                    Terbaca AI: "{item.raw_name}" (Belum ada di katalog)
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onOpenQuickAddMedicineModal(index, item)}
                                                className="w-fit px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all duration-200 bg-[#48CFA4] text-white hover:bg-[#3bb890] dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                Tambah Obat Baru
                                            </button>
                                        </div>
                                    )}
                                    <InputError message={errors[`items.${index}.medicine_id`]} className="mt-1" />
                                </td>
                                <td className="px-2 py-3">
                                    <input type="text" value={item.batch_number} onChange={e => onItemChange(index, 'batch_number', e.target.value)} required placeholder="Cth: BATCH001" className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 uppercase font-mono" />
                                    <InputError message={errors[`items.${index}.batch_number`]} className="mt-1" />
                                </td>
                                <td className="px-2 py-3">
                                    <input type="date" value={item.expired_date} onChange={e => onItemChange(index, 'expired_date', e.target.value)} required className="w-full text-xs px-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium" />
                                    <InputError message={errors[`items.${index}.expired_date`]} className="mt-1" />
                                </td>
                                <td className="px-2 py-3">
                                    <div className="flex gap-2">
                                        <input type="number" min="1" value={item.quantity} onChange={e => onItemChange(index, 'quantity', e.target.value)} required className="w-16 text-xs text-center px-2 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-bold" />
                                        <select value={item.uom} onChange={e => onItemChange(index, 'uom', e.target.value)} className="w-full text-xs px-2 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-medium">
                                            <option value="Tablet">Tablet</option>
                                            <option value="Strip">Strip</option>
                                            <option value="Box">Box</option>
                                            <option value="Botol">Botol</option>
                                            <option value="Ampul">Ampul</option>
                                            <option value="Pcs">Pcs</option>
                                        </select>
                                    </div>
                                    <InputError message={errors[`items.${index}.quantity`]} className="mt-1" />
                                </td>
                                <td className="px-2 py-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">Rp</span>
                                        <input type="number" min="0" value={item.purchase_price} onChange={e => onItemChange(index, 'purchase_price', e.target.value)} required className="w-full text-xs pl-8 pr-3 py-2.5 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 font-mono font-bold" />
                                    </div>
                                    <InputError message={errors[`items.${index}.purchase_price`]} className="mt-1" />
                                </td>
                                <td className="px-2 py-3 text-right font-mono font-bold text-[#48CFA4]">
                                    {formatRupiah(item.subtotal)}
                                </td>
                                <td className="px-2 py-3 text-center">
                                    <button type="button" onClick={() => onRemoveItem(index)} disabled={data.items.length === 1} className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 transition-colors cursor-pointer">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Catatan Keterangan Faktur
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onGenerateAutoNotes}
                                disabled={isGeneratingNote}
                                className="px-4 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50 bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] cursor-pointer"
                            >
                                <svg className={`w-3.5 h-3.5 ${isGeneratingNote ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                {isGeneratingNote ? 'Merangkum...' : 'Rangkum Otomatis (AI)'}
                            </button>
                            {data.notes && (
                                <button
                                    type="button"
                                    onClick={() => setData('notes', '')}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea 
                        value={data.notes} 
                        onChange={e => setData('notes', e.target.value)} 
                        rows="4" 
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 text-sm" 
                        placeholder="Ketik catatan manual di sini, atau klik 'Rangkum Otomatis (AI)' untuk merangkum obat yang disuplai..."
                    ></textarea>
                    <InputError message={errors.notes} className="mt-2" />
                </div>
                
                <div className="text-right w-full md:w-auto bg-gray-50 dark:bg-[#151E24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-1">Total Nilai Faktur:</p>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-6 font-mono">
                        {formatRupiah(data.total_amount)}
                    </h2>
                    
                    <div className="flex justify-end gap-3">
                        <Link href={route('purchases.index')} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Batal</Link>
                        <button type="submit" disabled={processing || data.items.length === 0} className={MEDISYNC_BTN_CLASS}>
                            {processing ? 'Menyimpan...' : 'Simpan & Cetak BPB'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}