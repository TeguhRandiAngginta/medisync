import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout
            header="Dashboard Utama"
        >
            <Head title="Dashboard" />

            {/* Banner Selamat Datang */}
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Cabang Aktif: {user.branch?.name || 'Pusat'}</h3>
                    <p className="text-sm text-gray-500">Akses operasional hari ini berjalan normal.</p>
                </div>
                <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-full text-sm font-bold border border-teal-100">
                    Shift Aktif: Buka
                </div>
            </div>

            {/* Kartu Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Kartu 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">150</p>
                        <p className="text-sm text-gray-500 font-medium">Transaksi Hari Ini</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                </div>

                {/* Kartu 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">24</p>
                        <p className="text-sm text-gray-500 font-medium">Stok Obat Menipis</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                </div>

                {/* Kartu 3 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">5</p>
                        <p className="text-sm text-gray-500 font-medium">PO Pending</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    </div>
                </div>

                {/* Kartu 4 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-teal-600 mb-1">Rp 12.5M</p>
                        <p className="text-sm text-gray-500 font-medium">Omzet Hari Ini</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
            </div>

            {/* Tempat untuk Chart / Tabel ke depannya */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex items-center justify-center text-gray-400">
                Area Grafik / Aktivitas Terakhir (Akan dikembangkan)
            </div>
            
        </AuthenticatedLayout>
    );
}