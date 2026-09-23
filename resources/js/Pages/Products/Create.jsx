import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

// Ikon kustom SVG untuk form
const Icons = {
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>,
    Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Info: () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01"></path></svg>
};

export default function Create({ categories, units, racks }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: '',
        base_unit_id: '',
        type: 'obat_bebas',
        rack_id: '', // State untuk menyimpan pilihan lokasi rak
        description: '',
        product_units: [
            { unit_id: '', conversion_factor: 1, purchase_price: '', selling_price: '' }
        ]
    });

    const addUnitRow = () => {
        setData('product_units', [
            ...data.product_units,
            { unit_id: '', conversion_factor: '', purchase_price: '', selling_price: '' }
        ]);
    };

    const removeUnitRow = (index) => {
        const newUnits = [...data.product_units];
        newUnits.splice(index, 1);
        setData('product_units', newUnits);
    };

    const handleUnitChange = (index, field, value) => {
        const newUnits = [...data.product_units];
        newUnits[index][field] = value;
        setData('product_units', newUnits);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <AuthenticatedLayout header="Tambah Produk Baru">
            <Head title="Tambah Produk" />

            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Master Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU/Barcode akan dibuat otomatis oleh sistem setelah data disimpan.</p>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    
                    {/* --- BAGIAN 1: INFORMASI DASAR PRODUK --- */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-[#48CFA4] rounded-full"></span>
                            Identitas Produk
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Obat / Produk <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    required 
                                    placeholder="Contoh: Paracetamol (Hanya nama murni, tanpa dosis seperti 500mg)" 
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors font-medium" 
                                />
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Icons.Info />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Detail dosis dan ukuran kemasan didefinisikan pada master data berbeda.</span>
                                </div>
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kategori <span className="text-red-500">*</span></label>
                                <select 
                                    value={data.category_id} 
                                    onChange={e => setData('category_id', e.target.value)} 
                                    required 
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories && categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <InputError message={errors.category_id} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Golongan / Tipe <span className="text-red-500">*</span></label>
                                <select 
                                    value={data.type} 
                                    onChange={e => setData('type', e.target.value)} 
                                    required 
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                                >
                                    <option value="obat_bebas">Obat Bebas</option>
                                    <option value="obat_keras">Obat Keras</option>
                                    <option value="resep">Resep Dokter</option>
                                    <option value="alkes">Alat Kesehatan</option>
                                    <option value="suplemen">Suplemen & Vitamin</option>
                                    <option value="skincare">Perawatan Kulit (Skincare)</option>
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Satuan Terkecil (Base Unit) <span className="text-red-500">*</span></label>
                                <select 
                                    value={data.base_unit_id} 
                                    onChange={e => setData('base_unit_id', e.target.value)} 
                                    required 
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                                >
                                    <option value="">-- Misal: Tablet, Kapsul, Pcs --</option>
                                    {units && units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <InputError message={errors.base_unit_id} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lokasi Rak / Penyimpanan</label>
                                <select 
                                    value={data.rack_id} 
                                    onChange={e => setData('rack_id', e.target.value)} 
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                                >
                                    <option value="">-- Pilih Lokasi Fisik Obat --</option>
                                    {racks && racks.map(rack => (
                                        <option key={rack.id} value={rack.id}>{rack.name} ({rack.code})</option>
                                    ))}
                                </select>
                                <InputError message={errors.rack_id} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* --- BAGIAN 2: KONVERSI SATUAN & HARGA --- */}
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="w-2 h-6 bg-[#6FD8E8] rounded-full"></span>
                                Multi-Satuan & Harga Jual
                            </h4>
                            <button 
                                type="button" 
                                onClick={addUnitRow} 
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] rounded-full text-sm font-bold hover:bg-[#48CFA4] hover:text-white transition-colors"
                            >
                                <Icons.Plus /> Tambah Satuan Lain
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {data.product_units.map((unit, index) => (
                                <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-gray-50 dark:bg-[#151E24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative group transition-colors">
                                    
                                    <div className="col-span-1 lg:col-span-3">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1.5">Pilih Satuan</label>
                                        <select 
                                            value={unit.unit_id} 
                                            onChange={e => handleUnitChange(index, 'unit_id', e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-[#30413B] rounded-xl focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4] text-sm text-gray-900 dark:text-gray-100 transition-colors"
                                        >
                                            <option value="">Pilih...</option>
                                            {units && units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-1 lg:col-span-2">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1.5">Konversi (Isi)</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={unit.conversion_factor} 
                                            onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-[#30413B] rounded-xl focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4] text-sm text-gray-900 dark:text-gray-100 transition-colors" 
                                        />
                                    </div>
                                    
                                    <div className="col-span-1 lg:col-span-3">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1.5">Harga Beli/Modal (Rp)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            value={unit.purchase_price} 
                                            onChange={e => handleUnitChange(index, 'purchase_price', e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-[#30413B] rounded-xl focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4] text-sm text-gray-900 dark:text-gray-100 transition-colors" 
                                        />
                                    </div>
                                    
                                    <div className="col-span-1 lg:col-span-3">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1.5">Harga Jual (Rp)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            value={unit.selling_price} 
                                            onChange={e => handleUnitChange(index, 'selling_price', e.target.value)} 
                                            required 
                                            className="w-full px-3 py-2.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-[#30413B] rounded-xl focus:border-[#48CFA4] focus:ring-1 focus:ring-[#48CFA4] text-sm font-bold text-[#48CFA4] transition-colors" 
                                        />
                                    </div>
                                    
                                    <div className="col-span-1 lg:col-span-1 flex justify-end items-end pb-1.5">
                                        {data.product_units.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeUnitRow(index)} 
                                                className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors focus:outline-none"
                                                title="Hapus baris satuan ini"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.product_units && <p className="text-red-500 text-sm mt-3 font-medium">Periksa kembali isian satuan dan harga Anda.</p>}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 pb-12">
                        <Link 
                            href={route('products.index')} 
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            Batal
                        </Link>
                        
                        {/* Menggunakan Komponen Reusable yang baru */}
                        <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base">
                            {processing ? 'Menyimpan...' : 'Simpan Produk'}
                        </PrimaryButton>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}