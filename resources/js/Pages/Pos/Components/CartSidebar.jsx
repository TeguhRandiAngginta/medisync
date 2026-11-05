import React from 'react';

export default function CartSidebar({ 
    cart, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    payments, 
    setPayments, 
    totalPaid, 
    changeAmount, 
    handleProceedCheckout, 
    isProcessing, 
    formatRupiah 
}) {
    return (
        <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-[#151E24] border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Keranjang Kasir</h3>
                <span className="bg-[#48CFA4] text-white text-xs font-bold px-2 py-1 rounded-lg">{cart.length} Item</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <span className="font-bold">Keranjang kosong</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div key={item.medicine_id} className="flex flex-col p-3 border border-gray-100 dark:border-gray-800 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                                        {item.signa && <span className="text-[10px] text-[#48CFA4] font-bold">Resep: {item.signa}</span>}
                                        <span className="text-[10px] text-gray-400">Maksimal stok: {item.max_stock} {item.base_unit || ''}</span>
                                    </div>
                                    <button onClick={() => removeFromCart(item.medicine_id)} className="text-red-400 hover:text-red-600 cursor-pointer text-sm font-bold">✕</button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-mono font-bold">{formatRupiah(item.price)}</span>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#151E24] p-1 rounded-lg">
                                        {/* Tombol Kurangi (-) */}
                                        <button 
                                            onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)} 
                                            className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xs"
                                        >
                                            -
                                        </button>

                                        <span className="text-xs font-bold w-6 text-center text-gray-800 dark:text-gray-200">{item.quantity}</span>

                                        {/* Tombol Tambah (+), dikunci jika melebihi max_stock */}
                                        <button 
                                            onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)} 
                                            disabled={item.quantity >= item.max_stock}
                                            className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#151E24] border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-800 dark:text-gray-200">Total Tagihan</span>
                    <span className="text-xl text-[#246A55] dark:text-[#67E2B4] font-mono">{formatRupiah(subtotal)}</span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-gray-500 w-16">Tunai</label>
                        <input type="number" min="0" value={payments.cash || ''} onChange={(e) => setPayments({...payments, cash: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-sm text-gray-800 dark:text-gray-200 focus:ring-[#48CFA4]" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-gray-500 w-16">QRIS</label>
                        <input type="number" min="0" value={payments.qris || ''} onChange={(e) => setPayments({...payments, qris: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-sm text-gray-800 dark:text-gray-200 focus:ring-[#48CFA4]" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-gray-500 w-16">Transfer</label>
                        <input type="number" min="0" value={payments.transfer || ''} onChange={(e) => setPayments({...payments, transfer: Number(e.target.value)})} placeholder="0" className="w-full px-3 py-1.5 bg-white dark:bg-[#1E272E] border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-sm text-gray-800 dark:text-gray-200 focus:ring-[#48CFA4]" />
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Total Dibayar</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatRupiah(totalPaid)}</span>
                </div>

                {totalPaid > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-600 dark:text-gray-400">{changeAmount < 0 ? 'Kurang Bayar' : 'Kembalian'}</span>
                        <span className={`font-mono font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-[#48CFA4]'}`}>
                            {formatRupiah(Math.abs(changeAmount))}
                        </span>
                    </div>
                )}

                <button 
                    onClick={handleProceedCheckout}
                    disabled={cart.length === 0 || changeAmount < 0 || isProcessing}
                    className="w-full py-3 font-extrabold rounded-xl bg-[#48CFA4] hover:bg-[#3AB890] text-white shadow-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                    {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                </button>
            </div>
        </div>
    );
}