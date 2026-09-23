import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

// Form Ganti Profil
const UpdateProfileForm = () => {
    const user = usePage().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
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
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alamat Email</label>
                <input 
                    type="email" 
                    value={data.email} 
                    onChange={e => setData('email', e.target.value)} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                />
                <InputError message={errors.email} className="mt-2" />
            </div>
            <div className="flex items-center gap-4">
                <button disabled={processing} className="px-6 py-2.5 bg-[#48CFA4] text-white rounded-full font-bold hover:bg-[#3bb890] transition-colors disabled:opacity-50">
                    {processing ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
                {recentlySuccessful && <p className="text-sm text-green-600 dark:text-green-400 font-medium">Berhasil disimpan.</p>}
            </div>
        </form>
    );
};

// Form Ganti Password
const UpdatePasswordForm = () => {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password Saat Ini</label>
                <input 
                    type="password" 
                    value={data.current_password} 
                    onChange={e => setData('current_password', e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                />
                <InputError message={errors.current_password} className="mt-2" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password Baru</label>
                <input 
                    type="password" 
                    value={data.password} 
                    onChange={e => setData('password', e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                />
                <InputError message={errors.password} className="mt-2" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password Baru</label>
                <input 
                    type="password" 
                    value={data.password_confirmation} 
                    onChange={e => setData('password_confirmation', e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors" 
                />
                <InputError message={errors.password_confirmation} className="mt-2" />
            </div>
            <div className="flex items-center gap-4">
                <button disabled={processing} className="px-6 py-2.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full font-bold hover:bg-gray-700 dark:hover:bg-white transition-colors disabled:opacity-50">
                    {processing ? 'Memperbarui...' : 'Perbarui Password'}
                </button>
                {recentlySuccessful && <p className="text-sm text-green-600 dark:text-green-400 font-medium">Password diperbarui.</p>}
            </div>
        </form>
    );
};

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout header="Pengaturan Akun & Profil">
            <Head title="Pengaturan Profil" />

            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Blok Profil */}
                <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Informasi Pribadi</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Perbarui nama tampilan dan alamat email yang digunakan pada sistem.</p>
                    </div>
                    <UpdateProfileForm />
                </div>

                {/* Blok Keamanan */}
                <div className="bg-white dark:bg-[#1E272E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Keamanan Akun</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pastikan Anda menggunakan password yang kuat dan unik untuk menjaga keamanan data apotek.</p>
                    </div>
                    <UpdatePasswordForm />
                </div>

            </div>
        </AuthenticatedLayout>
    );
}