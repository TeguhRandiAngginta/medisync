import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard() {
    // Mengambil data user yang sudah dikirim dari HandleInertiaRequests tadi
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard MediSync
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 border-b border-gray-200">
                            <h3 className="text-2xl font-bold text-blue-600 mb-2">
                                Selamat datang, {user.name}!
                            </h3>
                            
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="font-semibold text-gray-700 mb-2">Informasi Sesi Aktif:</p>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>
                                        <span className="inline-block w-24 font-medium">Hak Akses</span> 
                                        : <span className="uppercase font-bold text-blue-700">{user.role?.name || 'Tidak Diketahui'}</span>
                                    </li>
                                    <li>
                                        <span className="inline-block w-24 font-medium">Lokasi</span> 
                                        : {user.branch?.name || 'Pusat'} ({user.branch?.code})
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}