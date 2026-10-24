import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Index({ logs, currentTab }) {
    const tabs = [
        { id: 'akun', label: 'Pengguna & Akun' },
        { id: 'inventaris', label: 'Inventaris' },
        { id: 'stok', label: 'Pergerakan Stok' },
        { id: 'pembelian', label: 'Pembelian' },
        { id: 'pos', label: 'POS / Penjualan' },
        { id: 'resep', label: 'Resep Masuk' },
        { id: 'supplier', label: 'Supplier' },
        { id: 'rak', label: 'Lokasi Rak' },
        { id: 'referensi', label: 'Data Referensi' },
    ];

    const handleTabChange = (tabId) => {
        router.get(route('audit-logs.index'), { tab: tabId }, {
            preserveState: true,
            replace: true,
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <AuthenticatedLayout header="Audit Log Sistem">
            <Head title="Audit Log"/>

            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rekam Jejak Aktivitas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pantau seluruh perubahan data dan transaksi oleh pengguna sistem.</p>
            </div>

            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 
                            ${currentTab === tab.id 
                                ? 'bg-[#48CFA4] text-white shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:border dark:border-[#48CFA4]/30' 
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 dark:bg-[#1E272E] dark:text-gray-400 dark:border-gray-800 dark:hover:bg-[#151E24]'
                            }`}
                    >
                        Log {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide text-sm">
                        Menampilkan Riwayat: <span className="text-[#48CFA4]">{tabs.find(t => t.id === currentTab)?.label}</span>
                    </h4>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Waktu</th>
                                <th className="px-6 py-4 font-bold">Pengguna (Aktor)</th>
                                <th className="px-6 py-4 font-bold">Aksi</th>
                                <th className="px-6 py-4 font-bold">Deskripsi Perubahan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-gray-400">Belum ada riwayat aktivitas yang tercatat.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24]">
                                        
                                        <td className="px-6 py-4 align-middle text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        
                                        <td className="px-6 py-4 align-middle">
                                            <div className="font-bold text-gray-800 dark:text-gray-200">{log.user?.name || 'Sistem'}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">{log.user?.role?.name || '-'}</div>
                                        </td>
                                        
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`inline-block w-20 text-center py-1.5 rounded-md text-[10px] font-bold tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 align-middle text-gray-600 dark:text-gray-300">
                                            {log.description}
                                        </td>
                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}