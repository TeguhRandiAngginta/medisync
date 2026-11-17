import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import MedicineCombobox from './Components/MedicineCombobox';
import BatchCombobox from './Components/BatchCombobox';
import InputError from '@/Components/InputError';

const MEDISYNC_BTN_CLASS = "px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none cursor-pointer";

export default function StockOpnameCreate({ medicines = [] }) {
    // Obat terpilih disimpan sebagai objek (bukan dicari dari daftar), karena daftar obat
    // kini hasil pencarian server dan tidak memuat seluruh katalog.
    const [selectedMedicine, setSelectedMedicine] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        product_batch_id: '',
        actual_stock: '',
        type: 'CORRECTION',
        notes: '',
    });

    const selectedBatch = useMemo(() => {
        if (!selectedMedicine || !data.product_batch_id) return null;
        return selectedMedicine.batches?.find((b) => String(b.id) === String(data.product_batch_id)) || null;
    }, [selectedMedicine, data.product_batch_id]);

    const difference = useMemo(() => {
        if (!selectedBatch || data.actual_stock === '') return null;
        const actual = parseInt(data.actual_stock, 10);
        if (isNaN(actual)) return null;
        return actual - selectedBatch.stock_quantity;
    }, [selectedBatch, data.actual_stock]);

    const handleSelectMedicine = (med) => {
        if (!med) {
            setSelectedMedicine(null);
            setData({
                ...data,
                product_batch_id: '',
                actual_stock: '',
            });
            return;
        }

        setSelectedMedicine(med);
        setData({
            ...data,
            product_batch_id: '',
            actual_stock: '',
        });
    };

    const handleSelectBatch = (batch) => {
        if (!batch) {
            setData({
                ...data,
                product_batch_id: '',
                actual_stock: '',
            });
            return;
        }

        setData({
            ...data,
            product_batch_id: batch.id,
            actual_stock: batch.stock_quantity,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('stock-adjustments.store'));
    };

    const adjustmentTypes = [
        {
            value: 'CORRECTION',
            label: 'Koreksi Rutin',
            desc: 'Penyesuaian selisih hitung fisik berkala',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        },
        {
            value: 'DAMAGE',
            label: 'Kerusakan Fisik',
            desc: 'Kemasan rusak / bocor / pecah di rak gudang',
            badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
        },
        {
            value: 'EXPIRED',
            label: 'Kedaluwarsa (ED)',
            desc: 'Obat melewati batas masa konsumsi',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        },
        {
            value: 'LOST',
            label: 'Selisih Hilang',
            desc: 'Fisik tidak ditemukan saat audit opname',
            badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        },
    ];

    return (
        <AuthenticatedLayout header="Catat Stock Opname Baru">
            <Head title="Input Stock Opname" />

            <div className="max-w-5xl mx-auto pb-12 space-y-6">
                {/* Header Breadcrumb / Title with Kembali Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Formulir Penyesuaian Stok (Opname)</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Pilih obat dan batch untuk melakukan rekonsiliasi fisik gudang.</p>
                    </div>

                    <Link
                        href={route('stock-adjustments.index')}
                        className="px-4 py-2 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 rounded-md text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 border border-gray-200 dark:border-gray-700/60 shadow-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card 1: Pilih Produk & Batch Obat */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors space-y-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 gap-4">
                            <div>
                                <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <span className="w-2.5 h-6 bg-[#48CFA4] rounded-full"></span> 1. Pilih Produk & Batch Obat
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">Pilih obat dari katalog master lalu pilih nomor batch spesifik yang akan dihitung fisik.</p>
                            </div>
                        </div>

                        {/* Searchable Combobox Obat */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                Pilih Obat Master <span className="text-red-500">*</span>
                            </label>
                            <MedicineCombobox
                                medicines={medicines}
                                selectedMedicine={selectedMedicine}
                                onSelect={handleSelectMedicine}
                                error={errors.medicine_id}
                            />
                        </div>

                        {/* Searchable Combobox Batch */}
                        {selectedMedicine && (
                            <div className="animate-in fade-in duration-200 pt-2 border-t border-gray-50 dark:border-gray-800/80">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                    Nomor Batch Obat (FEFO) <span className="text-red-500">*</span>
                                </label>
                                <BatchCombobox
                                    batches={selectedMedicine.batches || []}
                                    selectedBatchId={data.product_batch_id}
                                    baseUnit={selectedMedicine.base_unit || 'Pcs'}
                                    onSelect={handleSelectBatch}
                                    error={errors.product_batch_id}
                                />
                            </div>
                        )}
                    </div>

                    {/* Card 2: Rekonsiliasi & Hasil Opname */}
                    {selectedBatch && (
                        <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors space-y-6 animate-in fade-in duration-200">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 gap-4">
                                <div>
                                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <span className="w-2.5 h-6 bg-[#F6A84B] rounded-full"></span> 2. Rekonsiliasi & Hasil Opname
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1">Masukkan hasil perhitungan fisik riil dan tentukan jenis penyesuaian stok.</p>
                                </div>
                            </div>

                            {/* 3 Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Stok Sistem */}
                                <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Stok Sistem Saat Ini</span>
                                    <span className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100">
                                        {selectedBatch.stock_quantity} <span className="text-sm font-normal text-gray-400">{selectedMedicine?.base_unit}</span>
                                    </span>
                                </div>

                                {/* Stok Fisik Aktual */}
                                <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <label className="text-[11px] text-gray-700 dark:text-gray-300 uppercase font-bold tracking-wider block mb-1">
                                        Stok Fisik Aktual <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.actual_stock}
                                        onChange={(e) => setData('actual_stock', e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2 font-mono text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E272E] text-gray-900 dark:text-gray-100 focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 outline-none"
                                        required
                                    />
                                    <InputError message={errors.actual_stock} className="mt-1" />
                                </div>

                                {/* Selisih Fisik vs Sistem */}
                                <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Selisih Fisik vs Sistem</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl font-mono font-black ${
                                            difference === null ? 'text-gray-400' :
                                            difference > 0 ? 'text-emerald-500' :
                                            difference < 0 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-300'
                                        }`}>
                                            {difference === null ? '-' : difference > 0 ? `+${difference}` : difference}
                                        </span>
                                        {difference !== null && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                difference > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                difference < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {difference > 0 ? 'Surplus (+)' : difference < 0 ? 'Defisit (-)' : 'Sesuai (0)'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Jenis Penyesuaian & Catatan */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                        Jenis Penyesuaian <span className="text-red-500">*</span>
                                    </label>
                                    
                                    {/* Segmented Select Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {adjustmentTypes.map((adj) => {
                                            const isSelected = data.type === adj.value;
                                            return (
                                                <div
                                                    key={adj.value}
                                                    onClick={() => setData('type', adj.value)}
                                                    className={`p-3 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-[#48CFA4] bg-[#EAF5F0]/60 dark:bg-[#253939]/40 shadow-sm'
                                                            : 'border-gray-200 dark:border-gray-700/80 bg-gray-50/40 dark:bg-[#151E24] hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-xs text-gray-800 dark:text-gray-100">
                                                            {adj.label}
                                                        </span>
                                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                                            isSelected ? 'border-[#48CFA4] bg-[#48CFA4]' : 'border-gray-300 dark:border-gray-600'
                                                        }`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 leading-snug">
                                                        {adj.desc}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.type} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                        Catatan / Keterangan Penyesuaian
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Contoh: Ditemukan kemasan pecah di rak A-2 saat audit fisik bulanan..."
                                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-[#48CFA4] text-gray-900 dark:text-gray-100 text-sm outline-none"
                                    ></textarea>
                                    <InputError message={errors.notes} className="mt-1" />
                                </div>
                            </div>

                            {/* Footer Action Buttons */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Link
                                    href={route('stock-adjustments.index')}
                                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing || !data.product_batch_id || data.actual_stock === ''}
                                    className={MEDISYNC_BTN_CLASS}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {processing ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
