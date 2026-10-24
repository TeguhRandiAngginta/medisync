export default function ReceiptModal({ selectedSale, onClose, onPrint }) {
    if (!selectedSale) return null;

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white text-black p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 font-mono text-xs">
                
                {/* AREA YANG AKAN DICETAK (Menggunakan Table agar posisinya stabil sejajar kiri-kanan) */}
                <div id="modal-printable-receipt" className="bg-white text-black p-2" style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '11px', width: '100%' }}>
                    <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px dashed #000', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>APOTEK MEDISYNC</div>
                        <div>Nota: {selectedSale.invoice_number}</div>
                        <div>{new Date(selectedSale.sale_date).toLocaleString('id-ID')}</div>
                        <div>Kasir: {selectedSale.user?.name || 'Admin'}</div>
                    </div>
                    
                    <div style={{ paddingBottom: '8px', borderBottom: '1px dashed #000', marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <tbody>
                                {selectedSale.details.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ paddingBottom: '4px', verticalAlign: 'top' }}>
                                            {item.medicine?.name || 'Obat'} ({item.quantity}x)
                                        </td>
                                        <td style={{ paddingBottom: '4px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                            {formatRupiah(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ paddingBottom: '8px', borderBottom: '1px dashed #000', marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 'bold', paddingBottom: '2px' }}>Total Tagihan:</td>
                                    <td style={{ fontWeight: 'bold', textAlign: 'right', paddingBottom: '2px' }}>{formatRupiah(selectedSale.total_amount)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingBottom: '2px' }}>Metode Bayar:</td>
                                    <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{selectedSale.payment_method}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingBottom: '2px' }}>Total Dibayar:</td>
                                    <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{formatRupiah(selectedSale.paid_amount)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingBottom: '2px' }}>Kembalian:</td>
                                    <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{formatRupiah(selectedSale.change_amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '10px', paddingTop: '4px' }}>
                        TERIMA KASIH - LEKAS SEMBUH KEMBALI
                    </div>
                </div>

                {/* TOMBOL AKSI MODAL */}
                <div className="flex gap-2 pt-4 border-t mt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl font-sans font-bold"
                    >
                        Tutup
                    </button>
                    <button 
                        onClick={onPrint}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-sans font-bold shadow-md"
                    >
                        Cetak Ulang Struk
                    </button>
                </div>
            </div>
        </div>
    );
}