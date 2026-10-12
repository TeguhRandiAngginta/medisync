import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import ConfirmModal from '@/Components/ConfirmModal'; // Import komponen baru kita
import { useState } from 'react';

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

export default function Index({ users }) {
    const currentUser = usePage().props.auth.user;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setIsModalOpen(true);
    };

    const executeDelete = () => {
        setIsDeleting(true);
        router.delete(route('users.destroy', userToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setIsModalOpen(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    return (
        <AuthenticatedLayout header="Manajemen Akun Pengguna">
            <Head title="Manajemen Akun" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Pengguna Sistem</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akses kredensial karyawan (Apoteker, Kasir, Admin).</p>
                </div>
                <PrimaryButton as="link" href={route('users.create')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Buat Akun Baru
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Nama Karyawan</th>
                            <th className="px-6 py-4 font-bold">Alamat Email</th>
                            <th className="px-6 py-4 font-bold">Hak Akses (Role)</th>
                            <th className="px-6 py-4 font-bold">Lokasi Cabang</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    {u.name}
                                    {!u.is_active && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Nonaktif</span>
                                    )}
                                </td>
                                <td className="px-6 py-5 font-medium text-blue-600 dark:text-[#6FD8E8]">{u.email}</td>
                                <td className="px-6 py-5">
                                    <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                                        {u.role?.name || 'User'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-gray-600 dark:text-gray-400">{u.branch?.name || '-'}</td>
                                <td className="px-6 py-5 text-center">
                                    {u.id !== currentUser.id ? (
                                        <div className="flex justify-center items-center gap-3">
                                            <Link href={route('users.edit', u.id)} className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200">
                                                <EditIcon />
                                            </Link>
                                            <button onClick={() => confirmDelete(u)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200">
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-600 text-xs italic font-medium">Akun Anda</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pemanggilan Komponen Modal Universal */}
            <ConfirmModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={executeDelete}
                isProcessing={isDeleting}
                title="Hapus Akun Karyawan?"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus akses permanen untuk <span className="font-bold text-gray-700 dark:text-gray-200">{userToDelete?.name}</span>? Data yang dihapus tidak dapat dipulihkan.
                    </>
                }
            />

        </AuthenticatedLayout>
    );
}