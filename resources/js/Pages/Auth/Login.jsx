import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <Head title="Login - MediSync" />

            {/* Panel Kiri - Branding */}
            <div className="hidden lg:flex lg:w-5/12 bg-teal-500 flex-col items-center justify-center p-12 text-white rounded-r-[3rem] shadow-2xl z-10">
                <div className="w-full max-w-md text-center">
                    <div className="flex justify-center mb-8">
                        {/* Ikon Logo (Placeholder) */}
                        <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Welcome Back!</h1>
                    <p className="text-teal-50 text-lg leading-relaxed">
                        To keep connected with us please login with your personal info to access the MediSync Enterprise System.
                    </p>
                </div>
            </div>

            {/* Panel Kanan - Form Login */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-teal-600 mb-2">Sign In to MediSync</h2>
                        <p className="text-gray-500 text-sm">Gunakan email dan kata sandi yang telah didaftarkan oleh Superadmin.</p>
                    </div>

                    {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-full focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-700 transition-colors shadow-sm"
                                placeholder="Email Address"
                            />
                            <InputError message={errors.email} className="mt-2 ml-4" />
                        </div>

                        <div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-full focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-700 transition-colors shadow-sm"
                                placeholder="Password"
                            />
                            <InputError message={errors.password} className="mt-2 ml-4" />
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Ingat Saya</span>
                            </label>
                        </div>

                        <div className="pt-4 text-center">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full md:w-2/3 mx-auto px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            >
                                {processing ? 'MEMPROSES...' : 'SIGN IN'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}