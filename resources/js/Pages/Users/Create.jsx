import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function Create({ roles, branches }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        branch_id: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout header="Buat Akun Karyawan">
            <Head title="Buat Akun Baru" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kredensial Akses</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pastikan alamat email valid. Karyawan dapat mengubah passwordnya sendiri nanti.</p>
                </div>

                <form onSubmit={submit} className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap Karyawan <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Email Karyawan <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                value={data.email} 
                                onChange={e => setData('email', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password Sementara <span className="text-red-500">*</span></label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password <span className="text-red-500">*</span></label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={data.password_confirmation} 
                                onChange={e => setData('password_confirmation', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="w-4 h-4 text-[#48CFA4] rounded border-gray-300 focus:ring-[#48CFA4]" />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Tampilkan Password</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Hak Akses (Role) <span className="text-red-500">*</span></label>
                            <select 
                                value={data.role_id} 
                                onChange={e => setData('role_id', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors uppercase"
                            >
                                <option value="">-- PILIH ROLE --</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <InputError message={errors.role_id} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Penempatan Cabang <span className="text-red-500">*</span></label>
                            <select 
                                value={data.branch_id} 
                                onChange={e => setData('branch_id', e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors"
                            >
                                <option value="">-- PILIH CABANG --</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <InputError message={errors.branch_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link href={route('users.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                            Batal
                        </Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-8 text-base">
                            {processing ? 'Menyimpan...' : 'Buat Akun Karyawan'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}