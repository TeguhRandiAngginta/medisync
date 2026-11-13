import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PrescriptionModal({ 
    isOpen, 
    onClose, 
    isFetchingPrescription,
    handlePullPrescription
}) {
    const [drafts, setDrafts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDrafts();
        }
    }, [isOpen]);

    const fetchDrafts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('api.prescriptions.drafts'));
            setDrafts(response.data);
        } catch (error) {
            console.error("Gagal mengambil data resep draft", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-1">Antrean Resep (Belum Ditebus)</h3>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Pilih resep pasien untuk ditarik otomatis ke kasir.</p>
                    </div>
                    <button onClick={fetchDrafts} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <svg className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-xs font-bold text-gray-400">Memuat antrean resep...</div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">Tidak ada resep baru saat ini.</div>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft.id} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#48CFA4] transition-colors bg-gray-50 dark:bg-[#151E24]">
                                <div>
                                    <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{draft.patient_name}</div>
                                    <div className="text-[11px] text-gray-500 font-medium">Dokter: {draft.doctor_name}</div>
                                    <div className="text-[10px] text-[#48CFA4] font-mono mt-1">{draft.prescription_number}</div>
                                </div>
                                <button 
                                    onClick={() => handlePullPrescription(draft.prescription_number)}
                                    disabled={isFetchingPrescription}
                                    className="px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center transition-all duration-200 bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none disabled:opacity-50 cursor-pointer"
                                >
                                    Tarik ke Kasir
                                </button>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}