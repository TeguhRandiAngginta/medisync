import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function Edit({ userEdit, roles, branches }) {
    const { data, setData, put, processing, errors } = useForm({
        name: userEdit.name,
        email: userEdit.email,
        password: '',
        password_confirmation: '',
        role_id: userEdit.role_id,
        branch_id: userEdit.branch_id,
        is_active: userEdit.is_active,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        put(route('users.update', userEdit.id));
    };

    return (
        <AuthenticatedLayout header="Edit Akun Karyawan">
            <Head title="Edit Akun" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Perbarui Kredensial</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kosongkan kolom password jika tidak ingin menggantinya.</p>
                </div>

                <form onSubmit={submit} className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Status Aktif */}
                        <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-[#151E24] rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Status Karyawan Aktif</h4>
                                <p className="text-xs text-gray-500">Matikan sakelar ini jika karyawan sudah *resign* untuk mencabut akses sistem.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#48CFA4]"></div>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Akses</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Dropdown Role & Branch (Persis seperti Create) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Hak Akses (Role)</label>
                            <select value={data.role_id} onChange={e => setData('role_id', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl text-gray-900 dark:text-gray-100 uppercase">
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <InputError message={errors.role_id} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cabang</label>
                            <select value={data.branch_id} onChange={e => setData('branch_id', e.target.value)} required className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl text-gray-900 dark:text-gray-100">
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <InputError message={errors.branch_id} className="mt-2" />
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <h4 className="text-sm font-bold text-red-500 mb-4 border-b pb-2">Ubah Password (Opsional)</h4>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password Baru</label>
                            <input type={showPassword ? "text" : "password"} value={data.password} onChange={e => setData('password', e.target.value)} placeholder="Biarkan kosong jika tidak diubah" className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100" />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password Baru</label>
                            <input type={showPassword ? "text" : "password"} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100" />
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link href={route('users.index')} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center">Batal</Link>
                        <PrimaryButton type="submit" disabled={processing} className="px-8 text-base">
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}