import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScannerModal({ isOpen, onClose, onScan }) {
    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 100 } },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScan(decodedText);
            },
            (errorMessage) => {
            }
        );

        return () => {
            scanner.clear().catch(error => console.error("Gagal mematikan scanner", error));
        };
    }, [isOpen, onScan]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1E272E] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#151E24]">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Scan Barcode Obat</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-sm bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full transition-colors">
                        Tutup
                    </button>
                </div>
                <div className="p-6">
                    <div id="reader" className="w-full rounded-xl overflow-hidden border-2 border-[#48CFA4]/30"></div>
                    <p className="text-xs text-center text-gray-500 mt-4 font-medium">Arahkan kamera ke barcode pada kemasan pabrik.</p>
                </div>
            </div>
        </div>
    );
}