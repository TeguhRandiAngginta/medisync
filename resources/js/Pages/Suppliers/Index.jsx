import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react'; 
import PrimaryButton from '@/Components/PrimaryButton';
import ConfirmModal from '@/Components/ConfirmModal';
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

export default function Index({ suppliers }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (supplier) => {
        setSupplierToDelete(supplier);
        setIsModalOpen(true);
    };

    const executeDelete = () => {
        setIsDeleting(true);
        router.delete(route('suppliers.destroy', supplierToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setIsModalOpen(false);
            },
            onError: () => {
                setIsDeleting(false);
                setIsModalOpen(false);
            },
        });
    };

    return (
        <AuthenticatedLayout header="Direktori Supplier">
            <Head title="Data Supplier" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Pemasok Resmi</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola data distributor dan pabrik farmasi.</p>
                </div>
                <PrimaryButton as="link" href={route('suppliers.create')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Tambah Supplier
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Kode</th>
                            <th className="px-6 py-4 font-bold">Nama Perusahaan</th>
                            <th className="px-6 py-4 font-bold">Tipe (Referensi)</th>
                            <th className="px-6 py-4 font-bold">Telepon</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!suppliers || suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-400">Belum ada data supplier yang didaftarkan.</td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <tr key={supplier.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5 font-medium text-gray-900 dark:text-gray-200">{supplier.code}</td>
                                    <td className="px-6 py-5 font-bold text-blue-600 dark:text-[#6FD8E8]">{supplier.name}</td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                                            {supplier.supplier_type ? `${supplier.supplier_type.name}` : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-600 dark:text-gray-400 font-mono tracking-wide">{supplier.phone || '-'}</td>
                                    <td className="px-6 py-5 text-center">
                                        {supplier.is_active ? 
                                            <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full">Aktif</span> : 
                                            <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">Nonaktif</span>
                                        }
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <Link href={route('suppliers.edit', supplier.id)} className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200">
                                                <EditIcon />
                                            </Link>
                                            <button onClick={() => confirmDelete(supplier)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200">
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={executeDelete}
                isProcessing={isDeleting}
                title="Hapus Data Supplier?"
                message={
                    <>Apakah Anda yakin ingin menghapus data pemasok <span className="font-bold text-gray-700 dark:text-gray-200">{supplierToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.</>
                }
            />
        </AuthenticatedLayout>
    );
}