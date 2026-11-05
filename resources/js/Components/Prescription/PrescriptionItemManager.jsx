import { useEffect } from 'react';

export default function PrescriptionItemManager({ 
    medicines, data, setData, unmatchedMedicines, 
    selectedMedicine, setSelectedMedicine, 
    quantity, setQuantity, 
    signaFreq, setSignaFreq, 
    signaForm, setSignaForm, 
    signaTime, setSignaTime, 
    handleAddItem, handleRemoveItem 
}) {
    
    useEffect(() => {
        if (unmatchedMedicines.length > 0) {
            const autoNote = `[Auto-Substitusi AI]: Merk asli tidak terdaftar (${unmatchedMedicines.join(', ')}). Telah disesuaikan dengan kandungan sejenis.`;
            if (!data.notes.includes(autoNote)) {
                const updatedNotes = data.notes ? data.notes + ' | ' + autoNote : autoNote;
                setData('notes', updatedNotes);
            }
        }
    }, [unmatchedMedicines]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    return (
        <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-[#48CFA4] border-b border-gray-100 dark:border-gray-800 pb-2">2. Rincian Obat & Aturan Pakai</h3>
            
            {/* Kotak Peringatan Indikator Substitusi Otomatis */}
            {unmatchedMedicines.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl space-y-2">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Pemberitahuan Substitusi Merk Otomatis!</h4>
                            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">AI mendeteksi obat berikut belum terdaftar di database. Catatan audit substitusi telah **otomatis disematkan** ke catatan resep di bawah:</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {unmatchedMedicines.map((med, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded-lg">
                                        {med}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Input Manual Tambah Obat */}
            <div className="flex flex-wrap gap-3 items-end bg-gray-50 dark:bg-[#151E24] p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Cari Obat</label>
                    <select className="w-full bg-white dark:bg-[#1E272E] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer" value={selectedMedicine} onChange={e => setSelectedMedicine(e.target.value)}>
                        <option value="">-- Pilih --</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stok: {m.stock || 0})</option>)}
                    </select>
                </div>
                <div className="w-20">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Qty</label>
                    <input type="number" min="1" className="w-full bg-white dark:bg-[#1E272E] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-center text-gray-800 dark:text-gray-200" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div className="w-28">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Frekuensi</label>
                    <select className="w-full bg-white dark:bg-[#1E272E] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer" value={signaFreq} onChange={e => setSignaFreq(e.target.value)}>
                        <option>1 x 1</option><option>2 x 1</option><option>3 x 1</option><option>4 x 1</option>
                    </select>
                </div>
                <div className="w-28">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Bentuk</label>
                    <select className="w-full bg-white dark:bg-[#1E272E] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer" value={signaForm} onChange={e => setSignaForm(e.target.value)}>
                        <option>Tablet</option><option>Kapsul</option><option>Bungkus</option><option>Sirup</option><option>Tetes</option>
                    </select>
                </div>
                <div className="w-36">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Waktu Konsumsi</label>
                    <select className="w-full bg-white dark:bg-[#1E272E] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer" value={signaTime} onChange={e => setSignaTime(e.target.value)}>
                        <option>Sesudah Makan</option><option>Sebelum Makan</option><option>Saat Makan</option><option>Sebelum Tidur</option>
                    </select>
                </div>
                
                <button type="button" title="Tambah Obat" onClick={handleAddItem} className="p-2.5 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:opacity-80 transition-opacity cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
            </div>

            {/* Tabel Daftar Obat */}
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-[#151E24] text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="px-4 py-3 rounded-l-xl">Obat (Pilihan)</th>
                        <th className="px-4 py-3 w-28">Jumlah</th>
                        <th className="px-4 py-3">Aturan Pakai (Signa)</th>
                        <th className="px-4 py-3 rounded-r-xl text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.items.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-6 text-gray-400 font-bold">Belum ada obat yang ditambahkan. Silakan scan resep atau pilih manual.</td></tr>
                    ) : (
                        data.items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3">
                                    <select 
                                        className="w-full bg-white dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
                                        value={item.medicine_id}
                                        onChange={e => {
                                            const selected = medicines.find(m => m.id == e.target.value);
                                            if (selected) {
                                                const newItems = [...data.items];
                                                newItems[index].medicine_id = selected.id;
                                                newItems[index].name = selected.name;
                                                newItems[index].sku = selected.sku;
                                                setData('items', newItems);
                                            }
                                        }}
                                    >
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full bg-white dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5 text-xs text-center text-gray-800 dark:text-gray-200 font-bold"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                        type="text" 
                                        className="w-full bg-white dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-[#48CFA4] font-bold"
                                        value={item.signa}
                                        onChange={e => handleItemChange(index, 'signa', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button type="button" title="Hapus" onClick={() => handleRemoveItem(index)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition-colors cursor-pointer">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}