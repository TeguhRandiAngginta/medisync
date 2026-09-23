import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        specialization: '',
        phone: '',
        hospital_name: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('doctors.store'));
    };

    return (
        <AuthenticatedLayout header="Tambah Data Dokter">
            <Head title="Tambah Dokter" />

            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Dokter</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan detail dokter untuk referensi penebusan resep di POS.</p>
                </div>

                <form onSubmit={submit} className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap Dokter <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                required 
                                placeholder="Contoh: dr. Budi Santoso, Sp.PD"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Spesialisasi</label>
                            <input 
                                type="text" 
                                value={data.specialization} 
                                onChange={e => setData('specialization', e.target.value)} 
                                placeholder="Contoh: Dokter Umum, Penyakit Dalam"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.specialization} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                            <input 
                                type="text" 
                                value={data.phone} 
                                onChange={e => setData('phone', e.target.value)} 
                                placeholder="Kontak yang dapat dihubungi"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Instansi / Faskes Tempat Praktik</label>
                            <input 
                                type="text" 
                                value={data.hospital_name} 
                                onChange={e => setData('hospital_name', e.target.value)} 
                                placeholder="Contoh: RS Medika Utama, Klinik Sehat"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.hospital_name} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link href={route('doctors.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-8">
                            {processing ? 'Menyimpan...' : 'Simpan Data Dokter'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}