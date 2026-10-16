import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import InputError from '@/Components/InputError';

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

export default function Index({ currentTab, data }) {
    const tabs = [
        { id: 'tipe-lokasi', label: 'Tipe Lokasi & Rak' },
        { id: 'kode-negara', label: 'Kode Negara (+62)' },
        { id: 'golongan-obat', label: 'Golongan Obat' },
    ];

    const handleTabChange = (tabId) => {
        router.get(route('references.index'), { tab: tabId }, { preserveState: true, replace: true });
    };

    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const locationForm = useForm({
        name: '',
        prefix_code: '',
        intended_for: '',
        description: '',
    });

    const openCreateModal = () => {
        setEditingItem(null);
        locationForm.reset();
        setIsLocationModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        locationForm.setData({
            name: item.name,
            prefix_code: item.prefix_code,
            intended_for: item.intended_for || '',
            description: item.description || '',
        });
        setIsLocationModalOpen(true);
    };

    const submitLocation = (e) => {
        e.preventDefault();
        if (editingItem) {
            locationForm.put(route('references.location-types.update', editingItem.id), {
                onSuccess: () => {
                    locationForm.reset();
                    setIsLocationModalOpen(false);
                    setEditingItem(null);
                }
            });
        } else {
            locationForm.post(route('references.location-types.store'), {
                onSuccess: () => {
                    locationForm.reset();
                    setIsLocationModalOpen(false);
                }
            });
        }
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        router.delete(route('references.location-types.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    return (
        <AuthenticatedLayout header="Data Referensi Sistem">
            <Head title="Data Referensi" />

            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Parameter & Referensi</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kelola master data pendukung yang akan digunakan pada seluruh dropdown fitur utama.</p>
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
                        {tab.label}
                    </button>
                ))}
            </div>

            {currentTab === 'tipe-lokasi' && (
                <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide text-sm">Daftar Tipe Titik Simpan</h4>
                        <button onClick={openCreateModal} className="px-4 py-2 bg-[#EAF5F0] text-[#246A55] dark:bg-[#253939] dark:text-[#67E2B4] rounded-lg font-bold text-xs hover:bg-[#48CFA4] hover:text-white transition-colors">
                            + Tambah Tipe Baru
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Prefix Kode</th>
                                    <th className="px-6 py-4 font-bold">Nama Tipe (Jenis)</th>
                                    <th className="px-6 py-4 font-bold">Peruntukan</th>
                                    <th className="px-6 py-4 font-bold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!data.locationTypes || data.locationTypes.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-16 text-center text-gray-400">Belum ada data referensi.</td></tr>
                                ) : (
                                    data.locationTypes.map((type) => (
                                        <tr key={type.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24]">
                                            <td className="px-6 py-4 font-bold text-[#48CFA4]">{type.prefix_code}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{type.name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{type.intended_for || 'Umum'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-3">
                                                    <button onClick={() => openEditModal(type)} className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200">
                                                        <EditIcon />
                                                    </button>
                                                    <button onClick={() => confirmDelete(type)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200">
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
                </div>
            )}

            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLocationModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingItem ? 'Edit Tipe Lokasi' : 'Tambah Tipe Lokasi Baru'}
                        </h3>
                        <form onSubmit={submitLocation} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Prefix Kode</label>
                                <input type="text" value={locationForm.data.prefix_code} onChange={e => locationForm.setData('prefix_code', e.target.value)} placeholder="Misal: KKS" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-lg text-sm dark:text-white uppercase font-bold" required />
                                <InputError message={locationForm.errors.prefix_code} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Tipe</label>
                                <input type="text" value={locationForm.data.name} onChange={e => locationForm.setData('name', e.target.value)} placeholder="Misal: Lemari Pendingin" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-lg text-sm dark:text-white" required />
                                <InputError message={locationForm.errors.name} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Peruntukan</label>
                                <input type="text" value={locationForm.data.intended_for} onChange={e => locationForm.setData('intended_for', e.target.value)} placeholder="Misal: Vaksin / Obat Khusus" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-lg text-sm dark:text-white" />
                                <InputError message={locationForm.errors.intended_for} />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 rounded-lg font-bold text-sm">Batal</button>
                                <button type="submit" disabled={locationForm.processing} className="flex-1 px-4 py-2 bg-[#48CFA4] text-white rounded-lg font-bold text-sm">
                                    {editingItem ? 'Simpan Perubahan' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title="Hapus Parameter?"
                message={<>Data referensi <span className="font-bold">{itemToDelete?.name}</span> akan dihapus permanen.</>}
            />
        </AuthenticatedLayout>
    );
}