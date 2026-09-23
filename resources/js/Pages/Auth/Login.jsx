import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { useState, useEffect } from 'react';

const Icons = {
    Cross: () => (
        <svg className="w-8 h-8 text-[#69C98A]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
        </svg>
    ),
    CheckCircle: () => (
        <svg className="w-5 h-5 text-[#69C98A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    ),
    Receipt: () => (
        <svg className="w-5 h-5 text-[#69C98A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
            <path d="M12 17.5v-11"></path>
        </svg>
    ),
    Chart: () => (
        <svg className="w-5 h-5 text-[#69C98A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
            <path d="M4 14l4-4 4 4 8-8"></path>
        </svg>
    ),
    Shield: () => (
        <svg className="w-5 h-5 text-[#69C98A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
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
    ArrowRight: () => (
        <svg className="w-5 h-5 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    ),
    Sun: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M4.93 19.07l1.41-1.41"></path>
            <path d="M17.66 6.34l1.41-1.41"></path>
        </svg>
    ),
    Moon: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
    ),
    MedicineBottle: () => (
        <svg className="w-48 h-48 text-[#69C98A] opacity-20 absolute -bottom-10 -left-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M6 4h12v3H6V4zm-1 5h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a1 1 0 0 1 1-1zm4 6v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm1 4h4v-2h-4v2z" />
        </svg>
    )
};

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Membaca preferensi tema saat halaman dimuat
    useEffect(() => {
        const theme = localStorage.getItem('theme');
        const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Menyimpan preferensi jika diubah di halaman Login
    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-[#FFF9F2] dark:bg-[#101817] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300 relative overflow-hidden">
            <Head title="Login - MediSync" />

            {/* Tombol Tema (Kanan Atas) */}
            <button 
                type="button"
                onClick={toggleTheme}
                className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50 p-2.5 rounded-full bg-white dark:bg-[#1E2B27] text-gray-400 dark:text-[#A7BBB1] hover:text-[#69C98A] dark:hover:text-[#78D99A] shadow-sm border border-gray-100 dark:border-[#30413B] transition-colors"
            >
                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            {/* Dekorasi Bentuk Medis Abstrak Latar Belakang (Subtle) */}
            <div className="absolute top-10 left-10 text-[#C4F7CA] dark:text-[#18221F] opacity-30 dark:opacity-20 pointer-events-none">
                <Icons.Cross />
            </div>
            <div className="absolute bottom-20 right-20 text-[#92EEFF] dark:text-[#18221F] opacity-30 dark:opacity-20 scale-150 pointer-events-none">
                <Icons.Cross />
            </div>

            {/* Main Card Container (Split Card Layout) */}
            <div className="w-full max-w-[1000px] bg-white dark:bg-[#18221F] rounded-[24px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col lg:flex-row overflow-hidden border border-[#E2E8F0] dark:border-[#30413B] z-10 relative">
                
                {/* Panel Kiri - Branding & Fitur (45%) */}
                <div className="w-full lg:w-[45%] bg-[#F2FCF5] dark:bg-[#1E2B27] p-10 lg:p-14 relative overflow-hidden flex flex-col justify-center border-r border-[#E2E8F0]/50 dark:border-[#30413B]">
                    
                    <div className="flex items-center gap-3 mb-12">
                        <Icons.Cross />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-widest text-[#1F2937] dark:text-[#E8F5EE]">MEDISYNC</span>
                            <span className="text-[10px] uppercase text-[#64748B] dark:text-[#A7BBB1] tracking-wider font-semibold">Pharmacy Management System</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-[32px] font-bold text-[#1F2937] dark:text-[#E8F5EE] leading-tight mb-4">
                            Welcome Back!
                        </h1>
                        <p className="text-[#64748B] dark:text-[#A7BBB1] text-[15px] leading-relaxed mb-10 max-w-sm">
                            Silakan masuk ke akun Anda untuk mengakses sistem manajemen apotek.
                        </p>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <Icons.CheckCircle />
                                <span className="text-[14px] text-[#1F2937] dark:text-[#E8F5EE] font-medium">Kelola stok obat dengan mudah</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Icons.Receipt />
                                <span className="text-[14px] text-[#1F2937] dark:text-[#E8F5EE] font-medium">Pantau transaksi secara real-time</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Icons.Chart />
                                <span className="text-[14px] text-[#1F2937] dark:text-[#E8F5EE] font-medium">Laporan lengkap dan akurat</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Icons.Shield />
                                <span className="text-[14px] text-[#1F2937] dark:text-[#E8F5EE] font-medium">Keamanan data terjamin</span>
                            </div>
                        </div>
                    </div>

                    <Icons.MedicineBottle />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#C4F7CA] dark:bg-[#6FD8E8]/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                </div>

                {/* Panel Kanan - Form Login (55%) */}
                <div className="w-full lg:w-[55%] p-10 lg:p-16 flex flex-col justify-center bg-white dark:bg-[#18221F]">
                    
                    <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <Icons.Cross />
                        </div>

                        <div className="text-center w-full mb-10">
                            <h2 className="text-[#69C98A] dark:text-[#78D99A] text-sm font-bold tracking-wide uppercase mb-3">Pharmacy Management System</h2>
                            <h3 className="text-[28px] font-bold text-[#1F2937] dark:text-[#E8F5EE] mb-2">Login to Your Account</h3>
                            <p className="text-[#64748B] dark:text-[#A7BBB1] text-sm">Masuk untuk melanjutkan ke dashboard sistem manajemen apotek.</p>
                        </div>

                        {status && <div className="mb-6 font-medium text-sm text-[#69C98A] text-center w-full bg-[#EAF5F0] dark:bg-[#1E2B27] py-2 rounded-lg">{status}</div>}

                        <form onSubmit={submit} className="w-full space-y-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Email</label>
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
                                        className="w-full pl-12 pr-4 py-3.5 bg-[#F1F5F9] dark:bg-[#1E2B27] border border-transparent dark:border-[#30413B] rounded-[14px] focus:bg-white dark:focus:bg-[#18221F] focus:border-[#69C98A] dark:focus:border-[#78D99A] focus:ring-2 focus:ring-[#C4F7CA] dark:focus:ring-[#78D99A]/20 text-[#1F2937] dark:text-[#E8F5EE] placeholder-[#94A3B8] dark:placeholder-[#7F968B] transition-all text-sm outline-none"
                                        placeholder="Masukkan email"
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2 ml-2" />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Password</label>
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
                                        placeholder="Masukkan password"
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

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="w-5 h-5 text-[#69C98A] bg-[#F1F5F9] dark:bg-[#1E2B27] border-[#E2E8F0] dark:border-[#30413B] rounded-md focus:ring-[#69C98A] focus:ring-offset-0 cursor-pointer transition-colors"
                                        />
                                    </div>
                                    <span className="ml-3 text-sm text-[#64748B] dark:text-[#A7BBB1] group-hover:text-[#1F2937] dark:group-hover:text-[#E8F5EE] transition-colors font-medium">
                                        Ingat saya
                                    </span>
                                </label>
                                
                                <Link 
                                    href={route('password.request')} 
                                    className="text-sm font-semibold text-[#69C98A] dark:text-[#78D99A] hover:text-[#55B978] dark:hover:text-[#8AE4A8] transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center py-4 px-4 bg-[#69C98A] hover:bg-[#55B978] dark:bg-[#78D99A] dark:hover:bg-[#8AE4A8] text-white dark:text-[#101817] rounded-[14px] shadow-[0_4px_14px_rgba(105,201,138,0.3)] dark:shadow-[0_4px_14px_rgba(120,217,154,0.2)] hover:shadow-[0_6px_20px_rgba(105,201,138,0.4)] transition-all duration-200 text-[15px] font-bold disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {processing ? 'Memproses...' : 'Masuk'}
                                    {!processing && <Icons.ArrowRight />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center flex flex-col items-center justify-center text-[12px] text-[#94A3B8] dark:text-[#7F968B] space-y-1">
                <p>Sistem Informasi Manajemen Apotek</p>
                <p>© 2027 MEDISYNC</p>
            </div>
        </div>
    );
}