import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';

const CrossIcon = () => (
    <svg className="w-10 h-10 text-[#69C98A] mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
    </svg>
);

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen bg-[#FFF9F2] dark:bg-[#101817] flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
            <Head title="Lupa Password - MediSync" />

            <div className="w-full max-w-md bg-white dark:bg-[#18221F] rounded-[24px] shadow-sm border border-[#E2E8F0] dark:border-[#30413B] p-8 lg:p-10 relative z-10">
                <CrossIcon />
                
                <h2 className="text-2xl font-bold text-[#1F2937] dark:text-[#E8F5EE] text-center mb-2">Lupa Password?</h2>
                <p className="text-[#64748B] dark:text-[#A7BBB1] text-sm text-center mb-8 leading-relaxed">
                    Tidak masalah. Masukkan alamat email akun Anda dan kami akan mengirimkan tautan untuk mengatur ulang password.
                </p>

                {status && <div className="mb-6 font-medium text-sm text-[#69C98A] text-center bg-[#EAF5F0] dark:bg-[#1E2B27] py-3 rounded-lg">{status}</div>}

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#1F2937] dark:text-[#E8F5EE] mb-2 ml-1">Email Terdaftar</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-4 py-3.5 bg-[#F1F5F9] dark:bg-[#1E2B27] border border-transparent dark:border-[#30413B] rounded-[14px] focus:bg-white dark:focus:bg-[#18221F] focus:border-[#69C98A] dark:focus:border-[#78D99A] focus:ring-2 focus:ring-[#C4F7CA] dark:focus:ring-[#78D99A]/20 text-[#1F2937] dark:text-[#E8F5EE] transition-all text-sm outline-none"
                            placeholder="contoh@medisync.com"
                            required
                        />
                        <InputError message={errors.email} className="mt-2 ml-2" />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 px-4 bg-[#69C98A] hover:bg-[#55B978] dark:bg-[#78D99A] dark:hover:bg-[#8AE4A8] text-white dark:text-[#101817] rounded-[14px] font-bold transition-all duration-200 disabled:opacity-70"
                        >
                            {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <Link href={route('login')} className="text-sm font-semibold text-[#64748B] dark:text-[#A7BBB1] hover:text-[#69C98A] dark:hover:text-[#78D99A] transition-colors">
                            Kembali ke halaman Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}