import React from 'react';

export default function PrescriptionModal({ 
    isOpen, 
    onClose, 
    prescriptionNumber, 
    setPrescriptionNumber, 
    prescriptionError,
    setPrescriptionError,
    isFetchingPrescription,
    handlePullPrescription
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-800 animate-in zoom-in-95">
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">Tarik Data Resep</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4">Masukkan Nomor Resep untuk memuat obat secara otomatis ke kasir.</p>
                
                <input 
                    type="text" 
                    placeholder="Contoh: RSP-20261104-001" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-sm mb-2 text-gray-800 dark:text-gray-200 focus:ring-[#48CFA4]"
                    value={prescriptionNumber}
                    onChange={(e) => setPrescriptionNumber(e.target.value.toUpperCase())}
                />
                {prescriptionError && <p className="text-red-500 text-xs font-bold mb-2">{prescriptionError}</p>}
                
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => { onClose(); setPrescriptionError(''); }}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handlePullPrescription}
                        disabled={isFetchingPrescription || !prescriptionNumber}
                        className="flex-1 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {isFetchingPrescription ? 'Mencari...' : 'Muat Resep'}
                    </button>
                </div>
            </div>
        </div>
    );
}