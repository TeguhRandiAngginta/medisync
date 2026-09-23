import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        description: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('racks.store'));
    };

    return (
        <AuthenticatedLayout header="Tambah Lokasi Rak Baru">
            <Head title="Tambah Rak Penyimpanan" />

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-2xl mx-auto transition-colors duration-300">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Lokasi</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tentukan titik penyimpanan obat seperti etalase depan atau rak gudang belakang.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kode Rak / Etalase</label>
                        <input 
                            type="text" 
                            value={data.code} 
                            onChange={e => setData('code', e.target.value)} 
                            required 
                            placeholder="Misal: RAK-A1"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors uppercase" 
                        />
                        <InputError message={errors.code} className="mt-2" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lokasi</label>
                        <input 
                            type="text" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            required 
                            placeholder="Misal: Etalase Obat Bebas"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Keterangan Tambahan (Opsional)</label>
                        <textarea 
                            value={data.description} 
                            onChange={e => setData('description', e.target.value)} 
                            rows="3"
                            placeholder="Detail posisi rak..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                        ></textarea>
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                        <Link href={route('racks.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#48CFA4] text-white rounded-full font-bold hover:bg-[#3bb890] transition-colors disabled:opacity-50">
                            {processing ? 'Menyimpan...' : 'Simpan Lokasi'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}