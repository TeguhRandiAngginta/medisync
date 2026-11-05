import React from 'react';

export default function ReceiptModal({ sale, onClose, onPrint, formatRupiah }) {
    if (!sale) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white text-black p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 font-mono text-xs animate-in zoom-in-95">
                
                <div id="printable-receipt" className="bg-white text-black p-2">
                    <div className="text-center pb-3 border-b border-dashed border-gray-400">
                        <div className="font-bold text-sm">APOTEK MEDISYNC</div>
                        <div>Nota: {sale.invoice_number}</div>
                        <div>{sale.date}</div>
                    </div>
                    
                    <div className="py-3 space-y-2 border-b border-dashed border-gray-400 max-h-48 overflow-y-auto custom-scrollbar">
                        {sale.items.map((i, idx) => (
                            <div key={idx} className="flex flex-col">
                                <div className="flex justify-between">
                                    <span className="font-bold">{i.name} ({i.quantity}x)</span>
                                    <span className="font-bold">{formatRupiah(i.price * i.quantity)}</span>
                                </div>
                                {i.signa && <span className="text-[10px] text-gray-600 mt-1">* {i.signa}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="py-3 space-y-1 border-b border-dashed border-gray-400">
                        <div className="flex justify-between font-bold">
                            <span>Total Tagihan:</span>
                            <span>{formatRupiah(sale.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Metode Bayar:</span>
                            <span className="font-bold uppercase">{sale.method}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Dibayar:</span>
                            <span className="font-bold">{formatRupiah(sale.paid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kembalian:</span>
                            <span className="font-bold">{formatRupiah(sale.change)}</span>
                        </div>
                    </div>

                    <div className="text-center py-3 text-[10px] font-bold">
                        TERIMA KASIH - LEKAS SEMBUH KEMBALI
                    </div>
                </div>

                {/* TOMBOL AKSI */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 mt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-sans font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Tutup
                    </button>
                    <button 
                        onClick={onPrint}
                        className="flex-1 py-2 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-sans font-bold shadow-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Cetak Struk
                    </button>
                </div>
            </div>
        </div>
    );
}