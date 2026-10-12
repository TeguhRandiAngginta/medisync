import { Fragment } from 'react';

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Ya, Hapus', 
    cancelText = 'Batal', 
    isProcessing = false 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Background Overlay dengan efek Blur */}
            <div 
                className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isProcessing ? onClose : undefined} // Cegah tutup kalau lagi loading
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all border border-gray-100 dark:border-gray-800 scale-100 opacity-100 animate-in fade-in zoom-in duration-200">
                
                {/* Logo MediSync */}
                <div className="w-16 h-16 bg-[#EAF5F0] dark:bg-[#253939] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-[#1E272E] shadow-sm">
                    <svg className="w-8 h-8 text-[#48CFA4]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
                    </svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
                
                {/* Mendukung tag HTML/JSX di dalam pesan agar bisa cetak tebal (bold) */}
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 px-2">
                    {message}
                </div>

                <div className="flex gap-3 w-full">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#151E24] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Memproses...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}