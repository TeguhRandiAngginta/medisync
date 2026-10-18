import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Edit({ rackEdit, locationTypes }) {
    const { data, setData, put, processing, errors } = useForm({
        location_type_id: rackEdit.location_type_id || '',
        code: rackEdit.code || '',
        name: rackEdit.name || '',
        description: rackEdit.description || '',
        is_active: rackEdit.is_active,
    });

    const handleTypeChange = (e) => {
        const typeId = e.target.value;
        const selectedType = locationTypes.find(t => t.id == typeId);

        if (selectedType) {
            const parts = data.code.split('-');
            const uniqueNumber = parts.length > 1 ? parts[1] : data.code;
            
            setData(prev => ({
                ...prev,
                location_type_id: typeId,
                code: `${selectedType.prefix_code}-${uniqueNumber}`
            }));
        } else {
            setData('location_type_id', typeId);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('racks.update', rackEdit.id));
    };

    return (
        <AuthenticatedLayout header="Perbarui Lokasi Rak">
            <Head title="Edit Rak Penyimpanan" />

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-2xl mx-auto transition-colors duration-300">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Lokasi</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pindahkan rak ke tipe lokasi lain atau ubah status keaktifannya.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-[#151E24] rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800 mb-6">
                        <div>
                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Status Penggunaan Rak</h4>
                            <p className="text-xs text-gray-500">Matikan jika rak ini sedang direnovasi atau tidak digunakan.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#48CFA4]"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipe Titik Simpan (Referensi)</label>
                        <select 
                            value={data.location_type_id} 
                            onChange={handleTypeChange}
                            required
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                        >
                            <option value="">-- Pilih Tipe Lokasi --</option>
                            {locationTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name} ({type.prefix_code}) - Peruntukan: {type.intended_for || 'Umum'}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.location_type_id} className="mt-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kode Rak / Etalase</label>
                        <input 
                            type="text" 
                            value={data.code} 
                            onChange={e => setData('code', e.target.value)} 
                            required 
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-[#11181C] border-transparent rounded-xl text-gray-900 dark:text-gray-100 transition-colors uppercase font-mono font-bold text-[#48CFA4]" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Kode otomatis menyesuaikan jika Tipe Lokasi diubah.</p>
                        <InputError message={errors.code} className="mt-2" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Detail Lokasi</label>
                        <input 
                            type="text" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            required 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Keterangan Tambahan</label>
                        <textarea 
                            value={data.description} 
                            onChange={e => setData('description', e.target.value)} 
                            rows="3"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                        ></textarea>
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                        <Link href={route('racks.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#48CFA4] text-white rounded-full font-bold hover:bg-[#3bb890] transition-colors disabled:opacity-50">
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}