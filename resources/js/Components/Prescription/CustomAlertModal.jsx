export default function CustomAlertModal({ show, message, type, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center border border-gray-100 dark:border-gray-800 animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'error' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
                    {type === 'error' ? (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    ) : (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    )}
                </div>
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-2">
                    {type === 'error' ? 'Peringatan!' : 'Berhasil!'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 break-words break-all max-h-40 overflow-y-auto">
                    {message}
                </p>
                <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm transition-colors">
                    Mengerti
                </button>
            </div>
        </div>
    );
}