import React, { useRef } from 'react';
import InputError from '@/Components/InputError';

const MEDISYNC_BTN_CLASS = "px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none cursor-pointer";

export default function PurchaseHeaderCard({
    data,
    setData,
    errors,
    supplierList,
    isScanning,
    previewUrl,
    onFileSelected,
    onScanAI,
    onOpenPreview,
    unregisteredSupplier,
    setUnregisteredSupplier,
    onOpenQuickAddSupplierModal
}) {
    const fileInputRef = useRef(null);

    return (
        <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors relative overflow-hidden">
            {isScanning && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#1E272E]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[#48CFA4]/30 border-t-[#48CFA4] rounded-full animate-spin mb-3"></div>
                    <p className="text-[#48CFA4] font-bold text-sm">AI sedang membaca isi faktur...</p>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 gap-4">
                <div>
                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#48CFA4] rounded-full"></span> Informasi Dokumen Pembelian (PBF)
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Upload foto nota faktur lalu klik Ekstrak AI untuk mengisi formulir otomatis.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={onFileSelected} 
                        className="hidden" 
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={MEDISYNC_BTN_CLASS}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        {data.attachment ? 'Ganti File Nota' : 'Pilih File Nota'}
                    </button>

                    <button type="button" onClick={onScanAI} disabled={!data.attachment || isScanning} className={MEDISYNC_BTN_CLASS}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Ekstrak dengan AI
                    </button>

                    {previewUrl && (
                        <button type="button" onClick={onOpenPreview} className="text-xs font-bold text-[#48CFA4] hover:underline cursor-pointer ml-1">
                            Lihat Preview Nota
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">No. Sistem (Internal)</label>
                    <input type="text" value={data.internal_receipt_number} disabled className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 font-mono font-bold cursor-not-allowed" />
                    <InputError message={errors.internal_receipt_number} className="mt-2" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">No. Faktur PBF Asli <span className="text-red-500">*</span></label>
                    <input type="text" value={data.invoice_number} onChange={e => setData('invoice_number', e.target.value)} required placeholder="Cth: INV/2026/001" className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 uppercase font-bold" />
                    <InputError message={errors.invoice_number} className="mt-2" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Pilih Supplier PBF <span className="text-red-500">*</span></label>
                    <select 
                        value={data.supplier_id} 
                        onChange={e => {
                            setData('supplier_id', e.target.value);
                            if (e.target.value) setUnregisteredSupplier(null);
                        }} 
                        required 
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 font-medium"
                    >
                        <option value="">-- Pilih Supplier --</option>
                        {supplierList.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                    </select>
                    <InputError message={errors.supplier_id} className="mt-2" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Tanggal di Faktur <span className="text-red-500">*</span></label>
                    <input type="date" value={data.purchase_date} onChange={e => setData('purchase_date', e.target.value)} required className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 font-medium" />
                    <InputError message={errors.purchase_date} className="mt-2" />
                </div>
            </div>

            {/* BANNER PERINGATAN SUPPLIER BELUM TERDAFTAR */}
            {unregisteredSupplier && (
                <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                        <div>
                            <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                                Supplier "{unregisteredSupplier.name}" belum terdaftar di Data Master &gt; Pemasok / Supplier.
                            </p>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                                Anda dapat langsung mendaftarkannya secara praktis tanpa meninggalkan halaman ini{unregisteredSupplier.similarSupplier ? `, atau pilih pemasok serupa: ${unregisteredSupplier.similarSupplier.name}.` : '.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {unregisteredSupplier.similarSupplier && (
                            <button
                                type="button"
                                onClick={() => {
                                    setData('supplier_id', unregisteredSupplier.similarSupplier.id);
                                    setUnregisteredSupplier(null);
                                }}
                                className="px-4 py-2.5 bg-white dark:bg-[#1E272E] border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-md text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                            >
                                Gunakan "{unregisteredSupplier.similarSupplier.name}"
                            </button>
                        )}
                        <button type="button" onClick={onOpenQuickAddSupplierModal} className={MEDISYNC_BTN_CLASS}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Daftarkan Supplier Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}