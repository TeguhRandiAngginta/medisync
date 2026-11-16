import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function StockOpnameCreate({ medicines = [] }) {
    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        product_batch_id: '',
        actual_stock: '',
        type: 'CORRECTION',
        notes: '',
    });

    const filteredMedicines = useMemo(() => {
        if (!searchQuery) return medicines;
        const q = searchQuery.toLowerCase();
        return medicines.filter((m) =>
            m.name.toLowerCase().includes(q) || (m.sku && m.sku.toLowerCase().includes(q))
        );
    }, [medicines, searchQuery]);

    const selectedMedicine = useMemo(() => {
        return medicines.find((m) => String(m.id) === String(selectedMedicineId)) || null;
    }, [medicines, selectedMedicineId]);

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

    const handleMedicineChange = (medId) => {
        setSelectedMedicineId(medId);
        setData('product_batch_id', '');
        setData('actual_stock', '');
    };

    const handleBatchChange = (batchId) => {
        setData('product_batch_id', batchId);
        const batch = selectedMedicine?.batches?.find((b) => String(b.id) === String(batchId));
        if (batch) {
            setData('actual_stock', batch.stock_quantity);
        } else {
            setData('actual_stock', '');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('stock-adjustments.store'));
    };

    return (
        <AuthenticatedLayout header="Catat Stock Opname Baru">
            <Head title="Input Stock Opname" />

            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Formulir Penyesuaian Stok (Opname)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pilih obat dan batch untuk melakukan rekonsiliasi fisik gudang.</p>
                    </div>
                    <Link
                        href={route('stock-adjustments.index')}
                        className="px-4 py-2 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        &larr; Kembali
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-[#1E272E] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                        <h4 className="text-sm font-bold uppercase text-[#48CFA4] tracking-wider">1. Pilih Produk & Batch</h4>

                        {/* Search & Select Medicine */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                                Cari & Pilih Obat <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ketik nama atau SKU obat untuk menyaring..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full mb-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151E24] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none"
                            />
                            <select
                                value={selectedMedicineId}
                                onChange={(e) => handleMedicineChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none"
                                required
                            >
                                <option value="">-- Pilih Obat ({filteredMedicines.length} tersedia) --</option>
                                {filteredMedicines.map((med) => (
                                    <option key={med.id} value={med.id}>
                                        {med.name} ({med.sku}) - {med.batches?.length || 0} Batch Tersedia
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select Batch */}
                        {selectedMedicine && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                                    Nomor Batch Obat <span className="text-rose-500">*</span>
                                </label>
                                {(!selectedMedicine.batches || selectedMedicine.batches.length === 0) ? (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                        Obat ini belum memiliki batch tercatat di sistem. Harap masukkan faktur pembelian terlebih dahulu.
                                    </div>
                                ) : (
                                    <select
                                        value={data.product_batch_id}
                                        onChange={(e) => handleBatchChange(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#48CFA4] focus:border-transparent outline-none font-mono"
                                        required
                                    >
                                        <option value="">-- Pilih Batch --</option>
                                        {selectedMedicine.batches.map((batch) => (
                                            <option key={batch.id} value={batch.id}>
                                                Batch: {batch.batch_number} | Sisa Stok Sistem: {batch.stock_quantity} {selectedMedicine.base_unit} | ED: {batch.expired_date}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.product_batch_id && (
                                    <p className="mt-1.5 text-xs text-rose-500 font-semibold">{errors.product_batch_id}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Input Reconciliation */}
                    {selectedBatch && (
                        <div className="bg-white dark:bg-[#1E272E] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <h4 className="text-sm font-bold uppercase text-[#48CFA4] tracking-wider">2. Rekonsiliasi & Hasil Opname</h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Stok Sistem Saat Ini</span>
                                    <span className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100">
                                        {selectedBatch.stock_quantity} <span className="text-sm font-normal text-gray-400">{selectedMedicine?.base_unit}</span>
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <label className="text-xs text-gray-700 dark:text-gray-300 uppercase font-bold block mb-1">
                                        Stok Fisik Aktual <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.actual_stock}
                                        onChange={(e) => setData('actual_stock', e.target.value)}
                                        className="w-full px-3 py-1.5 font-mono text-xl font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E272E] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#48CFA4] outline-none"
                                        required
                                    />
                                    {errors.actual_stock && (
                                        <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.actual_stock}</p>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#151E24] border border-gray-100 dark:border-gray-800">
                                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Selisih Fisik vs Sistem</span>
                                    <span className={`text-2xl font-mono font-bold ${
                                        difference === null ? 'text-gray-400' :
                                        difference > 0 ? 'text-emerald-500' :
                                        difference < 0 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {difference === null ? '-' : difference > 0 ? `+${difference}` : difference}
                                        {difference !== null && (
                                            <span className="text-xs font-normal ml-1">
                                                ({difference > 0 ? 'Surplus' : difference < 0 ? 'Defisit' : 'Cocok'})
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                                        Jenis Penyesuaian <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#48CFA4] outline-none"
                                        required
                                    >
                                        <option value="CORRECTION">Koreksi Opname Rutin</option>
                                        <option value="DAMAGE">Kerusakan Fisik Barang</option>
                                        <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                                        <option value="LOST">Barang Hilang / Selisih Fisik</option>
                                    </select>
                                    {errors.type && (
                                        <p className="mt-1.5 text-xs text-rose-500 font-semibold">{errors.type}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                                        Catatan / Keterangan Penyesuaian
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Contoh: Ditemukan kemasan botol pecah di rak A-2 saat audit bulanan..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151E24] text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#48CFA4] outline-none"
                                    ></textarea>
                                    {errors.notes && (
                                        <p className="mt-1.5 text-xs text-rose-500 font-semibold">{errors.notes}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                                <Link
                                    href={route('stock-adjustments.index')}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-[#48CFA4] hover:bg-[#3bb890] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#48CFA4]/20 transition-all disabled:opacity-50"
                                >
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
