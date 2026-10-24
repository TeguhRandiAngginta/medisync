const WarningIcon = () => (
    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

export default function ConfirmModal({ isOpen, title, message, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center border dark:border-gray-800">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <WarningIcon />
                </div>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
                
                <div className="flex gap-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-600/30 transition-all"
                    >
                        Ya, Lanjutkan
                    </button>
                </div>
            </div>
        </div>
    );
}