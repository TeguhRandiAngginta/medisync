import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PhoneInput from '@/Components/PhoneInput';

export default function Edit({ supplierEdit, supplierTypes = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_type_id: supplierEdit.supplier_type_id || '',
        code: supplierEdit.code || '',
        name: supplierEdit.name || '',
        contact_person: supplierEdit.contact_person || '',
        phone: supplierEdit.phone || '',
        email: supplierEdit.email || '',
        address: supplierEdit.address || '',
        is_active: supplierEdit.is_active,
    });

    const handleTypeChange = (e) => {
        const typeId = e.target.value;
        const selected = supplierTypes.find(t => t.id == typeId);
        
        if (selected) {
            const parts = data.code.split('-');
            const uniqueNumber = parts.length > 1 ? parts[1] : data.code;
            
            setData(prev => ({
                ...prev,
                supplier_type_id: typeId,
                code: `${selected.prefix_code}-${uniqueNumber}`
            }));
        } else {
            setData('supplier_type_id', typeId);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('suppliers.update', supplierEdit.id));
    };

    return (
        <AuthenticatedLayout header="Perbarui Data Supplier">
            <Head title="Edit Supplier"/>

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-3xl mx-auto transition-colors duration-300">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Perusahaan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ubah detail pemasok atau nonaktifkan jika kerja sama telah berakhir.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    
                    <div className="p-4 bg-gray-50 dark:bg-[#151E24] rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                        <div>
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Status Kemitraan</h4>
                            <p className="text-xs text-gray-500">Matikan jika perusahaan ini tidak lagi menjadi penyuplai obat.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#48CFA4]"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipe Pemasok (Referensi)</label>
                            <select 
                                value={data.supplier_type_id} 
                                onChange={handleTypeChange}
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
                            <InputError message={errors.supplier_type_id} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kode Pemasok</label>
                            <input 
                                type="text" 
                                value={data.code} 
                                onChange={e => setData('code', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-[#11181C] border-transparent rounded-xl text-gray-900 dark:text-gray-100 transition-colors uppercase font-mono font-bold text-[#48CFA4]" 
                            />
                            <p className="text-[11px] text-gray-500 mt-1">Otomatis berubah menyesuaikan tipe pemasok.</p>
                            <InputError message={errors.code} className="mt-2" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Perusahaan</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kontak Person</label>
                            <input type="text" value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                            <InputError message={errors.contact_person} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                            <PhoneInput value={data.phone} onChange={(value) => setData('phone', value)} />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Email</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
                            <textarea value={data.address} onChange={e => setData('address', e.target.value)} rows="3" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"></textarea>
                            <InputError message={errors.address} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                        <Link href={route('suppliers.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Batal</Link>
                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#48CFA4] text-white rounded-full font-bold hover:bg-[#3bb890] transition-colors disabled:opacity-50">
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}   