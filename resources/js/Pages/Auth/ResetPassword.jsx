import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { useState } from 'react';

// Kumpulan Ikon SVG Kustom
const Icons = {
    Cross: () => (
        <svg className="w-10 h-10 text-[#69C98A] mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
        </svg>
    ),
    Mail: () => (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M2 4l10 8 10-8"></path>
        </svg>
    ),
    Lock: () => (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    ),
    Eye: () => (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    ),
    EyeOff: () => (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    ),
};

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-[#FFF9F2] dark:bg-[#101817] flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
            <Head title="Atur Ulang Password - MediSync" />

            <div className="w-full max-w-md bg-white dark:bg-[#18221F] rounded-[24px] shadow-sm border border-[#E2E8F0] dark:border-[#30413B] p-8 lg:p-10 relative z-10">
                
                <Icons.Cross />
                
                <h2 className="text-2xl font-bold text-[#1F2937] dark:text-[#E8F5EE] text-center mb-2">Atur Ulang Password</h2>
                <p className="text-[#64748B] dark:text-[#A7BBB1] text-sm text-center mb-8 leading-relaxed">
                    Silakan buat kata sandi baru untuk akun Anda. Pastikan kata sandi kuat dan mudah diingat.
                </p>

                <form onSubmit={submit} className="space-y-5">
                    {/* Input Email (Read-only/Prefilled) */}
                    <div>
                        <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Email Terdaftar</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4">
                                <Icons.Mail />
                            </div>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-[#F1F5F9] dark:bg-[#1E2B27] border border-transparent dark:border-[#30413B] rounded-[14px] focus:bg-white dark:focus:bg-[#18221F] focus:border-[#69C98A] dark:focus:border-[#78D99A] focus:ring-2 focus:ring-[#C4F7CA] dark:focus:ring-[#78D99A]/20 text-[#1F2937] dark:text-[#E8F5EE] transition-all text-sm outline-none"
                            />
                        </div>
                        <InputError message={errors.email} className="mt-2 ml-2" />
                    </div>

                    {/* Input Password Baru */}
                    <div>
                        <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Password Baru</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4">
                                <Icons.Lock />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="w-full pl-12 pr-12 py-3.5 bg-[#F1F5F9] dark:bg-[#1E2B27] border border-transparent dark:border-[#30413B] rounded-[14px] focus:bg-white dark:focus:bg-[#18221F] focus:border-[#69C98A] dark:focus:border-[#78D99A] focus:ring-2 focus:ring-[#C4F7CA] dark:focus:ring-[#78D99A]/20 text-[#1F2937] dark:text-[#E8F5EE] placeholder-[#94A3B8] dark:placeholder-[#7F968B] transition-all text-sm outline-none"
                                placeholder="Masukkan password baru"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#30413B] transition-colors focus:outline-none"
                            >
                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-2 ml-2" />
                    </div>

                    {/* Input Konfirmasi Password */}
                    <div>
                        <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Konfirmasi Password</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4">
                                <Icons.Lock />
                            </div>
                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                className="w-full pl-12 pr-12 py-3.5 bg-[#F1F5F9] dark:bg-[#1E2B27] border border-transparent dark:border-[#30413B] rounded-[14px] focus:bg-white dark:focus:bg-[#18221F] focus:border-[#69C98A] dark:focus:border-[#78D99A] focus:ring-2 focus:ring-[#C4F7CA] dark:focus:ring-[#78D99A]/20 text-[#1F2937] dark:text-[#E8F5EE] placeholder-[#94A3B8] dark:placeholder-[#7F968B] transition-all text-sm outline-none"
                                placeholder="Ketik ulang password baru"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#30413B] transition-colors focus:outline-none"
                            >
                                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2 ml-2" />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 px-4 bg-[#69C98A] hover:bg-[#55B978] dark:bg-[#78D99A] dark:hover:bg-[#8AE4A8] text-white dark:text-[#101817] rounded-[14px] font-bold transition-all duration-200 disabled:opacity-70"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Password Baru'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-8 text-center text-[12px] text-[#94A3B8] dark:text-[#7F968B]">
                <p>© 2025 MEDISYNC - Pharmacy Management System</p>
            </div>
        </div>
    );
}