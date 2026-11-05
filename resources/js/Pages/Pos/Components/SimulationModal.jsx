import React from 'react';

export default function SimulationModal({ 
    isOpen, 
    onClose, 
    simulationType, 
    payments, 
    formatRupiah, 
    executeFinalCheckout, 
    isProcessing 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1E272E] p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center border border-gray-100 dark:border-gray-800 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-1">Menunggu Pembayaran {simulationType}</h3>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4">Silakan verifikasi pembayaran non-tunai pelanggan sebesar <strong className="text-emerald-500">{formatRupiah(payments.qris + payments.transfer)}</strong></p>
                
                <div className="bg-gray-50 dark:bg-[#151E24] p-4 rounded-2xl mb-6 border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Gateway Pembayaran Aktif</div>
                    <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">STATUS: MENUNGGU KONFIRMASI EDC</div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                    >
                        Batalkan
                    </button>
                    <button 
                        onClick={executeFinalCheckout}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#48CFA4]/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {isProcessing ? 'Memproses...' : 'Konfirmasi Sukses'}
                    </button>
                </div>
            </div>
        </div>
    );
}