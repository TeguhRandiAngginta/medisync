import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('suppliers.store'));
    };

    return (
        <AuthenticatedLayout header="Tambah Supplier Baru">
            <Head title="Tambah Supplier" />

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-3xl mx-auto transition-colors duration-300">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Informasi Perusahaan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan detail lengkap pemasok atau pabrik farmasi.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kode Pemasok</label>
                            <input 
                                type="text" 
                                value={data.code} 
                                onChange={e => setData('code', e.target.value)} 
                                required 
                                placeholder="Misal: SPL-002"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            {errors.code && <span className="text-red-500 text-xs mt-1 block">{errors.code}</span>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Perusahaan</label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kontak Person</label>
                            <input 
                                type="text" 
                                value={data.contact_person} 
                                onChange={e => setData('contact_person', e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                            <input 
                                type="text" 
                                value={data.phone} 
                                onChange={e => setData('phone', e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Email</label>
                            <input 
                                type="email" 
                                value={data.email} 
                                onChange={e => setData('email', e.target.value)} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
                            <textarea 
                                value={data.address} 
                                onChange={e => setData('address', e.target.value)} 
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                        <Link href={route('suppliers.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#48CFA4] text-white rounded-full font-bold hover:bg-[#3bb890] transition-colors disabled:opacity-50">
                            {processing ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}