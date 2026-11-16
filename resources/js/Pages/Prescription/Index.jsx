import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const RestoreIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export default function Index({ prescriptions = [], trashed = false, trashedCount = 0 }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedPrint, setSelectedPrint] = useState(null);
    const [selectedEtiket, setSelectedEtiket] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmForceDelete, setConfirmForceDelete] = useState(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [confirmBulkRestore, setConfirmBulkRestore] = useState(false);
    const [confirmBulkForceDelete, setConfirmBulkForceDelete] = useState(false);

    const switchTab = (toTrash) => {
        setSelectedIds([]);
        router.get(route('prescriptions.index'), toTrash ? { trashed: true } : {}, { preserveScroll: true, replace: true });
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? prescriptions.map((r) => r.id) : []);
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const executeDelete = () => {
        if (!confirmDelete) return;
        router.delete(route('prescriptions.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmDelete(null),
        });
    };

    const executeRestore = (id) => {
        router.post(route('prescriptions.restore', id), {}, {
            preserveScroll: true,
        });
    };

    const executeForceDelete = () => {
        if (!confirmForceDelete) return;
        router.delete(route('prescriptions.force-delete', confirmForceDelete.id), {
            preserveScroll: true,
            onFinish: () => setConfirmForceDelete(null),
        });
    };

    const executeBulkDestroy = () => {
        router.post(route('prescriptions.bulk-destroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkDelete(false);
                setSelectedIds([]);
            },
            onError: () => setConfirmBulkDelete(false),
        });
    };

    const executeBulkRestore = () => {
        router.post(route('prescriptions.bulk-restore'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkRestore(false);
                setSelectedIds([]);
            },
            onError: () => setConfirmBulkRestore(false),
        });
    };

    const executeBulkForceDelete = () => {
        router.post(route('prescriptions.bulk-force-delete'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmBulkForceDelete(false);
                setSelectedIds([]);
            },
            onError: () => setConfirmBulkForceDelete(false),
        });
    };

    const executePrint = () => {
        let printIframe = document.getElementById('copyresep-print-iframe');
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'copyresep-print-iframe';
            Object.assign(printIframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentWindow || printIframe.contentDocument.document || printIframe.contentDocument;
        iframeDoc.document.open();

        let itemsHtml = selectedPrint.items
            .map(
                (i) =>
                    `<div style="border-bottom: 1px dashed #000; padding: 6px 0;"><b>${i.medicine?.name || 'Obat'}</b> (Qty: ${i.quantity})<br/><span style="font-size:10px;">Aturan: ${i.signa}</span></div>`
            )
            .join('');

        iframeDoc.document.write(
            `<html><head><style>@page { size: 58mm auto; margin: 0; } body { font-family: monospace; font-size: 11px; width: 58mm; padding: 5px; margin: 0;}</style></head><body><div style="text-align:center; border-bottom:2px dashed #000; margin-bottom:10px;"><b>SALINAN RESEP</b><br/>APOTEK MEDISYNC</div><div>No: ${selectedPrint.prescription_number}<br/>Dr: ${selectedPrint.doctor_name}<br/>Pasien: ${selectedPrint.patient_name}<br/>Tgl: ${selectedPrint.prescription_date}</div><div style="border-top:2px dashed #000; margin-top:5px;">${itemsHtml}</div><div style="text-align:center; margin-top:15px; font-weight:bold; font-size:10px;">LEKAS SEMBUH</div></body></html>`
        );
        iframeDoc.document.close();

        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
            setSelectedPrint(null);
        }, 300);
    };

    const executePrintEtiket = () => {
        let printIframe = document.getElementById('etiket-print-iframe');
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'etiket-print-iframe';
            Object.assign(printIframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentWindow || printIframe.contentDocument.document || printIframe.contentDocument;
        iframeDoc.document.open();

        let etiketPages = selectedEtiket.items
            .map(
                (i) => `
            <div class="etiket-page">
                <div class="header">APOTEK MEDISYNC</div>
                <div class="patient">Pasien: <b>${selectedEtiket.patient_name}</b></div>
                <div class="date">${selectedEtiket.prescription_date}</div>
                <div class="medicine-name">${i.medicine?.name || 'Obat'}</div>
                <div class="signa-box">
                    <div class="signa-title">Aturan Pakai:</div>
                    <div class="signa-text">${i.signa}</div>
                </div>
            </div>
        `
            )
            .join('');

        iframeDoc.document.write(`
            <html>
            <head>
                <style>
                    @page { size: 50mm 30mm; margin: 0; }
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
                    .etiket-page {
                        width: 50mm; height: 30mm;
                        padding: 2mm 3mm;
                        box-sizing: border-box;
                        page-break-after: always;
                        position: relative;
                        overflow: hidden;
                    }
                    .header { text-align: center; font-size: 8px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 2px; }
                    .patient { font-size: 9px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .date { font-size: 7px; text-align: right; position: absolute; top: 2mm; right: 3mm; }
                    .medicine-name { font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .signa-box { border: 1.5px solid #000; border-radius: 3px; padding: 2px; text-align: center; height: 11mm; display: flex; flex-direction: column; justify-content: center; }
                    .signa-title { font-size: 7px; font-weight: bold; margin-bottom: 1px; }
                    .signa-text { font-size: 11px; font-weight: 900; }
                </style>
            </head>
            <body>
                ${etiketPages}
            </body>
            </html>
        `);
        iframeDoc.document.close();

        setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
            setSelectedEtiket(null);
        }, 300);
    };

    return (
        <AuthenticatedLayout header="Manajemen Resep Masuk">
            <Head title={trashed ? 'Trash - Resep Masuk' : 'Daftar Resep'} />

            {/* Header & Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                        {trashed ? 'Keranjang Sampah Resep (Trash)' : 'Riwayat Resep Masuk'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {trashed
                            ? 'Daftar resep yang dipindahkan ke trash. Pulihkan data atau hapus secara permanen.'
                            : 'Kelola pencatatan resep dokter, cetak etiket stiker, dan salinan resep.'}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && trashed && (
                        <>
                            <button
                                onClick={() => setConfirmBulkRestore(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-blue-600/20"
                            >
                                <RestoreIcon />
                                <span>Pulihkan ({selectedIds.length})</span>
                            </button>
                            <button
                                onClick={() => setConfirmBulkForceDelete(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                            >
                                <TrashIcon />
                                <span>Hapus Permanen ({selectedIds.length})</span>
                            </button>
                        </>
                    )}

                    {selectedIds.length > 0 && !trashed && (
                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs tracking-wide cursor-pointer shadow-md shadow-red-600/20"
                        >
                            <TrashIcon />
                            <span>Hapus ({selectedIds.length})</span>
                        </button>
                    )}

                    {/* Tab Toggle Pill */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => switchTab(false)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                !trashed
                                    ? 'bg-[#48CFA4] text-white dark:bg-[#253939] dark:text-[#67E2B4]'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            Data Aktif
                        </button>
                        <button
                            onClick={() => switchTab(true)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                                trashed
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white dark:bg-[#1E272E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                            }`}
                        >
                            <TrashIcon />
                            <span>Trash</span>
                            {trashedCount > 0 && (
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        trashed
                                            ? 'bg-white/20 text-white'
                                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                    }`}
                                >
                                    {trashedCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Add Button */}
                    {!trashed && (
                        <Link
                            href={route('prescriptions.create')}
                            title="Input Resep Baru"
                            className="p-2.5 bg-[#48CFA4] text-white hover:bg-[#3bb890] rounded-md transition-colors shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] flex items-center justify-center cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </Link>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-4 py-4 w-10 text-center">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={prescriptions.length > 0 && selectedIds.length === prescriptions.length}
                                    className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-4 font-bold">Nomor &amp; Lampiran</th>
                            <th className="px-6 py-4 font-bold">Pasien &amp; Dokter</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            {trashed && <th className="px-6 py-4 font-bold text-center">Dihapus Pada</th>}
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!prescriptions || prescriptions.length === 0 ? (
                            <tr>
                                <td colSpan={trashed ? 6 : 5} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                                    {trashed ? 'Keranjang sampah resep kosong.' : 'Belum ada resep masuk.'}
                                </td>
                            </tr>
                        ) : (
                            prescriptions.map((resep) => (
                                <tr
                                    key={resep.id}
                                    className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors ${
                                        selectedIds.includes(resep.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                    }`}
                                >
                                    <td className="px-4 py-5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(resep.id)}
                                            onChange={() => handleSelectOne(resep.id)}
                                            className="rounded border-gray-300 text-[#48CFA4] focus:ring-[#48CFA4] dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-mono font-bold text-gray-800 dark:text-gray-200">{resep.prescription_number}</div>
                                        {resep.attachment && (
                                            <a
                                                href={`/storage/${resep.attachment}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-blue-500 flex items-center gap-1 mt-1 hover:underline"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                    />
                                                </svg>
                                                <span>Lampiran Resep</span>
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{resep.patient_name}</div>
                                        <div className="text-xs text-gray-500">{resep.doctor_name}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {trashed ? (
                                            <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                Dihapus
                                            </span>
                                        ) : resep.status === 'DRAFT' ? (
                                            <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                BELUM DITEBUS
                                            </span>
                                        ) : (
                                            <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full">
                                                SUDAH DITEBUS
                                            </span>
                                        )}
                                    </td>
                                    {trashed && (
                                        <td className="px-6 py-5 text-center text-xs text-gray-400 font-mono">
                                            {resep.deleted_at ? new Date(resep.deleted_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            {trashed ? (
                                                <>
                                                    <button
                                                        onClick={() => executeRestore(resep.id)}
                                                        title="Pulihkan Resep"
                                                        className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <RestoreIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmForceDelete(resep)}
                                                        title="Hapus Permanen"
                                                        className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        title="Cetak Etiket Stiker"
                                                        onClick={() => setSelectedEtiket(resep)}
                                                        className="p-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                            />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        title="Cetak Salinan Resep"
                                                        onClick={() => setSelectedPrint(resep)}
                                                        className="p-2 bg-gray-100 hover:bg-gray-600 text-gray-600 hover:text-white dark:bg-[#25333D] dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {resep.status === 'DRAFT' && (
                                                        <Link
                                                            href={route('prescriptions.edit', resep.id)}
                                                            title="Edit Resep"
                                                            className="p-2 text-[#48CFA4] bg-[#EAF5F0] hover:bg-[#48CFA4] hover:text-white dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#48CFA4] dark:hover:text-white rounded-lg transition-all duration-200"
                                                        >
                                                            <EditIcon />
                                                        </Link>
                                                    )}

                                                    <button
                                                        title="Pindah ke Trash"
                                                        onClick={() => setConfirmDelete(resep)}
                                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL: Konfirmasi Soft Delete */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Pindah ke Tong Sampah?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Resep <strong className="font-mono text-gray-800 dark:text-gray-200">{confirmDelete.prescription_number}</strong> untuk pasien{' '}
                            <strong className="text-gray-800 dark:text-gray-200">{confirmDelete.patient_name}</strong> akan dipindahkan ke tong sampah.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Pindahkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Konfirmasi Force Delete */}
            {confirmForceDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <WarningIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Hapus Permanen?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Resep <strong className="font-mono text-red-600 dark:text-red-400">{confirmForceDelete.prescription_number}</strong> akan dihapus{' '}
                            <span className="font-black text-red-600">PERMANEN</span> dari database.
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            Tindakan ini tidak dapat dibatalkan!
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmForceDelete(null)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeForceDelete}
                                className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer"
                            >
                                Hapus Permanen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Delete */}
            {confirmBulkDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Hapus {selectedIds.length} Resep Terpilih?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Semua resep yang dicentang akan dipindahkan ke tong sampah secara bersamaan.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkDestroy}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Ya, Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Restore */}
            {confirmBulkRestore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RestoreIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Pulihkan {selectedIds.length} Resep Terpilih?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Semua resep yang dicentang akan dipulihkan ke daftar aktif.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkRestore(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkRestore}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
                            >
                                Ya, Pulihkan Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bulk Force Delete */}
            {confirmBulkForceDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <WarningIcon />
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                            Hapus Permanen {selectedIds.length} Resep?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Semua resep yang dicentang akan dihapus <span className="font-black text-red-600">PERMANEN</span> dari database.
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            Tindakan ini tidak dapat dibatalkan!
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmBulkForceDelete(false)}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkForceDelete}
                                className="px-6 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-bold hover:bg-red-800 transition-colors shadow-lg shadow-red-700/30 cursor-pointer"
                            >
                                Hapus Permanen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cetak Thermal */}
            {selectedPrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 font-mono text-xs text-black">
                        <div className="text-center pb-3 border-b border-dashed border-gray-400">
                            <div className="font-bold text-sm">SALINAN RESEP</div>
                            <div>APOTEK MEDISYNC</div>
                            <div className="mt-2 text-left">No: {selectedPrint.prescription_number}</div>
                            <div className="text-left">Tgl: {selectedPrint.prescription_date}</div>
                            <div className="text-left">Dr: {selectedPrint.doctor_name}</div>
                            <div className="text-left">Pasien: {selectedPrint.patient_name}</div>
                        </div>
                        <div className="py-3 max-h-48 overflow-y-auto">
                            {selectedPrint.items.map((i, idx) => (
                                <div key={idx} className="border-b border-dashed border-gray-400 py-2">
                                    <div className="font-bold">
                                        {i.medicine?.name || 'Obat'} (Qty: {i.quantity})
                                    </div>
                                    <div className="text-[10px]">Aturan: {i.signa}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center py-3 text-[10px] font-bold">LEKAS SEMBUH</div>
                        <div className="flex gap-2 pt-4 mt-2">
                            <button onClick={() => setSelectedPrint(null)} className="flex-1 py-2 bg-gray-200 font-sans font-bold rounded-xl text-gray-800 cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executePrint} className="flex-1 py-2 bg-emerald-600 font-sans font-bold rounded-xl text-white cursor-pointer">
                                Cetak Salinan (58mm)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cetak Etiket Stiker */}
            {selectedEtiket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-black text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Cetak Label Etiket</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Akan mencetak <b>{selectedEtiket.items.length} stiker</b> berukuran 50x30mm untuk ditempel pada kemasan obat pasien{' '}
                            <b>{selectedEtiket.patient_name}</b>.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedEtiket(null)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 font-sans font-bold rounded-xl text-gray-800 cursor-pointer transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executePrintEtiket}
                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-sans font-bold rounded-xl text-white shadow-md cursor-pointer transition-colors"
                            >
                                Mulai Cetak Stiker
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}