import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        address: '',
        allergies: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('patients.store'));
    };

    return (
        <AuthenticatedLayout header="Registrasi Pasien Baru">
            <Head title="Tambah Pasien" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Pasien</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nomor Rekam Medis (RM) akan dibuat otomatis oleh sistem.</p>
                </div>

                <form onSubmit={submit} className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap Pasien <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                required 
                                placeholder="Sesuai kartu identitas (KTP/SIM)"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Jenis Kelamin</label>
                            <select 
                                value={data.gender} 
                                onChange={e => setData('gender', e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                            >
                                <option value="">-- Pilih --</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                            <InputError message={errors.gender} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tanggal Lahir</label>
                            <input 
                                type="date" 
                                value={data.date_of_birth} 
                                onChange={e => setData('date_of_birth', e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.date_of_birth} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon / WhatsApp</label>
                            <input 
                                type="text" 
                                value={data.phone} 
                                onChange={e => setData('phone', e.target.value)} 
                                placeholder="Mulai dengan 08..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
                            <textarea 
                                value={data.address} 
                                onChange={e => setData('address', e.target.value)} 
                                rows="2"
                                placeholder="Jalan, RT/RW, Kelurahan..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            ></textarea>
                            <InputError message={errors.address} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-red-600 dark:text-red-400 mb-2">Riwayat Alergi Obat (Penting)</label>
                            <textarea 
                                value={data.allergies} 
                                onChange={e => setData('allergies', e.target.value)} 
                                rows="2"
                                placeholder="Misal: Alergi Amoxicillin, Asam Mefenamat (Kosongkan jika tidak ada)"
                                className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-red-400 focus:ring-2 focus:ring-red-400/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            ></textarea>
                            <InputError message={errors.allergies} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link href={route('patients.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                            Batal
                        </Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-8 text-base">
                            {processing ? 'Menyimpan...' : 'Simpan Data Pasien'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}