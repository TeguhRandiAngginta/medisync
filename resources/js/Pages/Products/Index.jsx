import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState } from 'react';

const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;

export default function Index({ products }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const confirmDelete = (product) => {
        setProductToDelete(product);
        setIsModalOpen(true);
    };

    const executeDelete = () => {
        router.delete(route('products.destroy', productToDelete.id), {
            preserveScroll: true,
            onFinish: () => setIsModalOpen(false)
        });
    };

    return (
        <AuthenticatedLayout header="Katalog Produk & Obat">
            <Head title="Katalog Produk" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Master Data Obat</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pusat data SKU, kategori, dan spesifikasi medis produk.</p>
                </div>
                <PrimaryButton as="link" href={route('products.create')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Tambah Obat Baru
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">SKU / Nama Obat</th>
                            <th className="px-6 py-4 font-bold">Golongan</th>
                            <th className="px-6 py-4 font-bold">Dosis & Satuan</th>
                            <th className="px-6 py-4 font-bold">Rak (Lokasi)</th>
                            <th className="px-6 py-4 font-bold text-center">Resep</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!products || products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-400">Katalog obat masih kosong.</td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-mono text-xs text-gray-500 mb-1">{product.sku}</div>
                                        <div className="font-bold text-blue-600 dark:text-[#6FD8E8]">{product.name}</div>
                                        {product.generic_name && <div className="text-[11px] text-gray-400">{product.generic_name}</div>}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                                            {product.category?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-700 dark:text-gray-300">
                                        <span className="font-bold">{product.dosage_strength || '-'}</span> {product.dosage_form} 
                                        <div className="text-xs text-gray-400 mt-1">Satuan: <span className="font-bold">{product.base_unit}</span></div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-[#48CFA4]">{product.rack?.code || '-'}</td>
                                    <td className="px-6 py-5 text-center">
                                        {product.requires_prescription ? 
                                            <span className="text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">Wajib</span> : 
                                            <span className="text-gray-400 text-xs">-</span>
                                        }
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <Link href={route('products.edit', product.id)} className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200"><EditIcon /></Link>
                                            <button onClick={() => confirmDelete(product)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200"><DeleteIcon /></button>
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
                title="Hapus Obat?"
                message={<>Apakah Anda yakin ingin menghapus <span className="font-bold">{productToDelete?.name}</span>?</>}
            />
        </AuthenticatedLayout>
    );
}