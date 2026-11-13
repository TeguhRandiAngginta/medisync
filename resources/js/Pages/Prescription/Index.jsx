import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ prescriptions }) {
    const [selectedPrint, setSelectedPrint] = useState(null);
    const [selectedEtiket, setSelectedEtiket] = useState(null);
    const [selectedDelete, setSelectedDelete] = useState(null);

    const executeDelete = () => {
        if (!selectedDelete) return;
        router.delete(route('prescriptions.destroy', selectedDelete.id), {
            onSuccess: () => setSelectedDelete(null)
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
        
        let itemsHtml = selectedPrint.items.map(i => `<div style="border-bottom: 1px dashed #000; padding: 6px 0;"><b>${i.medicine?.name || 'Obat'}</b> (Qty: ${i.quantity})<br/><span style="font-size:10px;">Aturan: ${i.signa}</span></div>`).join('');
        
        iframeDoc.document.write(`<html><head><style>@page { size: 58mm auto; margin: 0; } body { font-family: monospace; font-size: 11px; width: 58mm; padding: 5px; margin: 0;}</style></head><body><div style="text-align:center; border-bottom:2px dashed #000; margin-bottom:10px;"><b>SALINAN RESEP</b><br/>APOTEK MEDISYNC</div><div>No: ${selectedPrint.prescription_number}<br/>Dr: ${selectedPrint.doctor_name}<br/>Pasien: ${selectedPrint.patient_name}<br/>Tgl: ${selectedPrint.prescription_date}</div><div style="border-top:2px dashed #000; margin-top:5px;">${itemsHtml}</div><div style="text-align:center; margin-top:15px; font-weight:bold; font-size:10px;">LEKAS SEMBUH</div></body></html>`);
        iframeDoc.document.close();
        
        setTimeout(() => { printIframe.contentWindow.focus(); printIframe.contentWindow.print(); setSelectedPrint(null); }, 300);
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
        
        let etiketPages = selectedEtiket.items.map((i, index) => `
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
        `).join('');
        
        iframeDoc.document.write(`
            <html>
            <head>
                <style>
                    /* Ukuran Stiker Thermal Etiket (Lebar 50mm, Tinggi 30mm) */
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
        
        setTimeout(() => { printIframe.contentWindow.focus(); printIframe.contentWindow.print(); setSelectedEtiket(null); }, 300);
    };

    return (
        <AuthenticatedLayout header="Manajemen Resep Masuk">
            <Head title="Daftar Resep" />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">Riwayat Resep Masuk</h2>
                <Link 
                    href={route('prescriptions.create')} 
                    title="Catat Resep Baru" 
                    className="px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>Input Resep Baru</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-[#151E24] text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Nomor & Lampiran</th>
                                <th className="px-6 py-4">Pasien & Dokter</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {(!prescriptions || prescriptions.length === 0) ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400 font-bold">Belum ada resep masuk.</td></tr>
                            ) : (
                                prescriptions.map((resep) => (
                                    <tr key={resep.id} className="hover:bg-gray-50 dark:hover:bg-[#151E24]">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-gray-800 dark:text-gray-200">{resep.prescription_number}</div>
                                            {resep.attachment && (
                                                <a href={`/storage/${resep.attachment}`} target="_blank" className="text-[10px] text-blue-500 flex items-center gap-1 mt-1 hover:underline">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg> Lampiran Resep
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 dark:text-gray-200">{resep.patient_name}</div>
                                            <div className="text-xs text-gray-500">{resep.doctor_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${resep.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {resep.status === 'DRAFT' ? 'BELUM DITEBUS' : 'SUDAH DITEBUS'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {/* Tombol Cetak Etiket Stiker */}
                                                <button 
                                                    title="Cetak Etiket Stiker" 
                                                    onClick={() => setSelectedEtiket(resep)} 
                                                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                                </button>

                                                {/* Tombol Cetak Salinan */}
                                                <button 
                                                    title="Cetak Salinan Resep" 
                                                    onClick={() => setSelectedPrint(resep)} 
                                                    className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#25333D] dark:hover:bg-[#2E3F4C] text-gray-600 dark:text-gray-300 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                </button>

                                                {/* Tombol Edit */}
                                                {resep.status === 'DRAFT' && (
                                                    <Link 
                                                        href={route('prescriptions.edit', resep.id)} 
                                                        title="Edit Resep"
                                                        className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 rounded-xl transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                    </Link>
                                                )}

                                                {/* Tombol Hapus */}
                                                {resep.status === 'DRAFT' && (
                                                    <button 
                                                        title="Hapus Resep" 
                                                        onClick={() => setSelectedDelete(resep)} 
                                                        className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-xl transition-colors cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Kustom */}
            {selectedDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center border border-gray-100 dark:border-gray-800">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-1">Konfirmasi Hapus</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                            Apakah Anda yakin ingin menghapus resep <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{selectedDelete.prescription_number}</span> untuk pasien <span className="font-bold text-gray-700 dark:text-gray-300">{selectedDelete.patient_name}</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedDelete(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer">
                                Batal
                            </button>
                            <button onClick={executeDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer">
                                Ya, Hapus
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
                                    <div className="font-bold">{i.medicine?.name || 'Obat'} (Qty: {i.quantity})</div>
                                    <div className="text-[10px]">Aturan: {i.signa}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center py-3 text-[10px] font-bold">LEKAS SEMBUH</div>
                        <div className="flex gap-2 pt-4 mt-2">
                            <button onClick={() => setSelectedPrint(null)} className="flex-1 py-2 bg-gray-200 font-sans font-bold rounded-xl text-gray-800 cursor-pointer">Batal</button>
                            <button onClick={executePrint} className="flex-1 py-2 bg-emerald-600 font-sans font-bold rounded-xl text-white cursor-pointer">Cetak Salinan (58mm)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cetak Etiket Stiker */}
            {selectedEtiket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-black text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Cetak Label Etiket</h3>
                        <p className="text-xs text-gray-500 mb-6">Akan mencetak <b>{selectedEtiket.items.length} stiker</b> berukuran 50x30mm untuk ditempel pada kemasan obat pasien <b>{selectedEtiket.patient_name}</b>.</p>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedEtiket(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 font-sans font-bold rounded-xl text-gray-800 cursor-pointer transition-colors">Batal</button>
                            <button onClick={executePrintEtiket} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-sans font-bold rounded-xl text-white shadow-md cursor-pointer transition-colors">Mulai Cetak Stiker</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}