import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ categories, units }) {
    // Inisialisasi state form bawaan Inertia.js
    const { data, setData, post, processing, errors } = useForm({
        sku: '',
        name: '',
        category_id: '',
        base_unit_id: '',
        type: 'obat_bebas',
        description: '',
        // Array dinamis untuk menampung banyak konversi satuan
        product_units: [
            { unit_id: '', conversion_factor: 1, purchase_price: 0, selling_price: 0, is_default_purchase: true, is_default_sales: true }
        ]
    });

    // Fungsi menambah baris satuan baru
    const addUnitRow = () => {
        setData('product_units', [
            ...data.product_units,
            { unit_id: '', conversion_factor: '', purchase_price: 0, selling_price: 0, is_default_purchase: false, is_default_sales: false }
        ]);
    };

    // Fungsi menghapus baris satuan
    const removeUnitRow = (index) => {
        const newUnits = [...data.product_units];
        newUnits.splice(index, 1);
        setData('product_units', newUnits);
    };

    // Fungsi mengubah nilai input di dalam baris satuan tertentu
    const handleUnitChange = (index, field, value) => {
        const newUnits = [...data.product_units];
        newUnits[index][field] = value;
        setData('product_units', newUnits);
    };

    // Fungsi kirim data ke Laravel
    const submit = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Tambah Produk Baru</h2>}>
            <Head title="Tambah Produk" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="bg-white p-6 shadow-sm sm:rounded-lg space-y-6">
                        
                        {/* --- BAGIAN 1: INFORMASI DASAR PRODUK --- */}
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">Informasi Dasar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">SKU / Barcode</label>
                                    <input type="text" value={data.sku} onChange={e => setData('sku', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                    {errors.sku && <span className="text-red-500 text-xs">{errors.sku}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Produk / Obat</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                    {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                                    <select value={data.category_id} onChange={e => setData('category_id', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    {errors.category_id && <span className="text-red-500 text-xs">{errors.category_id}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipe</label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="obat_bebas">Obat Bebas</option>
                                        <option value="obat_keras">Obat Keras</option>
                                        <option value="resep">Resep Dokter</option>
                                        <option value="alkes">Alat Kesehatan</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Satuan Terkecil (Dasar)</label>
                                    <select value={data.base_unit_id} onChange={e => setData('base_unit_id', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Pilih Satuan Dasar (Misal: Tablet/Pcs) --</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    {errors.base_unit_id && <span className="text-red-500 text-xs">{errors.base_unit_id}</span>}
                                </div>
                            </div>
                        </div>

                        {/* --- BAGIAN 2: KONVERSI SATUAN & HARGA --- */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-700">Konversi Satuan & Harga</h3>
                                <button type="button" onClick={addUnitRow} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded font-bold hover:bg-green-200">
                                    + Tambah Satuan
                                </button>
                            </div>
                            
                            {data.product_units.map((unit, index) => (
                                <div key={index} className="grid grid-cols-5 gap-3 items-end bg-gray-50 p-4 rounded-md mb-3 border border-gray-200">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Satuan Jual/Beli</label>
                                        <select value={unit.unit_id} onChange={e => handleUnitChange(index, 'unit_id', e.target.value)} required className="mt-1 block w-full text-sm border-gray-300 rounded-md">
                                            <option value="">Pilih</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Isi (Faktor Konversi)</label>
                                        <input type="number" min="1" value={unit.conversion_factor} onChange={e => handleUnitChange(index, 'conversion_factor', e.target.value)} required className="mt-1 block w-full text-sm border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Harga Modal (Rp)</label>
                                        <input type="number" min="0" value={unit.purchase_price} onChange={e => handleUnitChange(index, 'purchase_price', e.target.value)} required className="mt-1 block w-full text-sm border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Harga Jual (Rp)</label>
                                        <input type="number" min="0" value={unit.selling_price} onChange={e => handleUnitChange(index, 'selling_price', e.target.value)} required className="mt-1 block w-full text-sm border-gray-300 rounded-md" />
                                    </div>
                                    <div className="text-right">
                                        {data.product_units.length > 1 && (
                                            <button type="button" onClick={() => removeUnitRow(index)} className="text-red-500 hover:text-red-700 text-sm font-bold pb-2">Hapus</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {errors.product_units && <span className="text-red-500 text-xs">Periksa kembali isian satuan Anda.</span>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href={route('products.index')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-300">Batal</Link>
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                                {processing ? 'Menyimpan...' : 'Simpan Produk'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}