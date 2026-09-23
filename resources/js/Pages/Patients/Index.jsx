import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ patients }) {
    return (
        <AuthenticatedLayout header="Direktori Pasien">
            <Head title="Data Pasien" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Rekam Medis Pasien</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola data pasien untuk keperluan riwayat transaksi dan resep.</p>
                </div>
                <PrimaryButton as="link" href={route('patients.create')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Tambah Pasien
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-y border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">No. RM</th>
                            <th className="px-6 py-4 font-bold">Nama Pasien</th>
                            <th className="px-6 py-4 font-bold">L/P</th>
                            <th className="px-6 py-4 font-bold">No. Telepon</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!patients || patients.length === 0) ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center text-gray-400">Belum ada data pasien teregistrasi.</td>
                            </tr>
                        ) : (
                            patients.map((patient) => (
                                <tr key={patient.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-4 font-bold text-[#48CFA4]">{patient.patient_number}</td>
                                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-[#6FD8E8]">{patient.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{patient.gender === 'L' ? 'Laki-laki' : (patient.gender === 'P' ? 'Perempuan' : '-')}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{patient.phone || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {patient.is_active ? 
                                            <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full">Aktif</span> : 
                                            <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Nonaktif</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}