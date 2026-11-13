import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PrescriptionFormHeader from '@/Pages/Prescription/Components/PrescriptionFormHeader';
import PrescriptionItemManager from '@/Pages/Prescription/Components/PrescriptionItemManager';
import CustomAlertModal from '@/Pages/Prescription/Components/CustomAlertModal';

export default function Create({ medicines }) {
    const { data, setData, post, processing, errors } = useForm({
        patient_name: '',
        doctor_name: '',
        prescription_date: new Date().toISOString().split('T')[0],
        notes: '',
        attachment: null,
        items: []
    });

    const [isScanning, setIsScanning] = useState(false);
    const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' });
    const [unmatchedMedicines, setUnmatchedMedicines] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [signaFreq, setSignaFreq] = useState('3 x 1');
    const [signaForm, setSignaForm] = useState('Tablet');
    const [signaTime, setSignaTime] = useState('Sesudah Makan');

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const formatDoctorName = (name) => {
        let clean = name.replace(/^(dr\.|dr|Dr\.|Dr|drs\.|Drs\.)\s*/i, '').trim();
        return clean ? `dr. ${clean}` : '';
    };

    const handleDoctorChange = (e) => {
        setData('doctor_name', formatDoctorName(e.target.value));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setData('attachment', file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleScanAI = async (e) => {
        if (e) e.preventDefault(); 
        
        const file = data.attachment;
        if (!file) {
            return setCustomAlert({ 
                show: true, 
                message: 'Harap pilih file gambar resep terlebih dahulu!', 
                type: 'error' 
            });
        }

        const cacheKey = `medisync_ocr_cache_v2_${file.name}_${file.size}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                processAiResult(parsedData);
                setCustomAlert({ 
                    show: true, 
                    message: 'Data resep dimuat dari memori lokal (Cache aktif)!', 
                    type: 'success' 
                });
                return;
            } catch (err) {
                localStorage.removeItem(cacheKey);
            }
        }

        setIsScanning(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64String = reader.result.split(',')[1];
                const mimeType = file.type;

                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error("Kunci VITE_GEMINI_API_KEY belum dipasang di file .env!");
                }

                const prompt = `Anda adalah sistem OCR apotek profesional. Analisis resep dokter terlampir (termasuk tulisan tangan medis atau bahasa Latin/asing).
                Daftar nama obat utama di katalog stok kami: ${JSON.stringify(medicines.map(m => m.name.split(' ')[0]))}.
                
                Tugas Anda:
                1. Ekstrak "patient_name", "doctor_name", dan "prescription_date" (WAJIB ubah ke format standar YYYY-MM-DD, misalnya "18. II. 33" menjadi "1933-02-18". Jika tidak ada atau tidak jelas, gunakan tanggal hari ini).
                2. Ekstrak SEMUA baris obat/bahan aktif yang tertulis setelah tanda Rp./R/ ke dalam array "items".
                
                KEMBALIKAN HANYA OBJECT JSON MURNI DENGAN STRUKTUR PERSIS SEPERTI INI (TANPA MARKDOWN):
                {
                    "patient_name": "nama pasien",
                    "doctor_name": "nama dokter",
                    "prescription_date": "YYYY-MM-DD",
                    "items": [
                        {
                            "name": "nama obat/bahan aktif utama (contoh: Kali jodati, Pilocarpini, Paracetamol)",
                            "quantity": 1,
                            "signa": "aturan pakai jika ada (contoh: Oculi kapky / 3 x 1)"
                        }
                    ]
                }`;

                let parsedData = null;
                let usedModelName = '';
                let lastErrorMessage = '';

                let activeModels = [];
                try {
                    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    if (listRes.ok) {
                        const listData = await listRes.json();
                        activeModels = (listData.models || [])
                            .filter(m => 
                                m.supportedGenerationMethods?.includes('generateContent') &&
                                (m.name.includes('flash') || m.name.includes('pro')) &&
                                !m.name.includes('tts') && 
                                !m.name.includes('audio') && 
                                !m.name.includes('gemma')
                            )
                            .map(m => m.name.replace('models/', ''));
                    }
                } catch (e) {
                    console.warn("Gagal mengambil daftar model dinamis, memakai fallback bawaan.", e);
                }

                if (activeModels.length === 0) {
                    activeModels = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-1.5-pro'];
                }

                for (const model of activeModels) {
                    const apiVersions = ['v1beta', 'v1'];
                    let success = false;

                    for (const apiVer of apiVersions) {
                        try {
                            const response = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [
                                            { text: prompt },
                                            { inlineData: { mimeType, data: base64String } }
                                        ]
                                    }]
                                })
                            });

                            const aiData = await response.json();

                            if (response.ok && aiData.candidates && aiData.candidates[0]?.content) {
                                const textRaw = aiData.candidates[0].content.parts[0].text;
                                const textClean = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                                parsedData = JSON.parse(textClean);
                                usedModelName = `${model} (${apiVer})`;
                                success = true;
                                break;
                            } else {
                                lastErrorMessage = aiData.error?.message || `HTTP ${response.status}`;
                            }
                        } catch (err) {
                            lastErrorMessage = err.message;
                        }
                    }

                    if (success) break;
                }

                if (!parsedData) {
                    throw new Error(`Gagal terhubung ke AI. Rincian: ${lastErrorMessage}`);
                }

                localStorage.setItem(cacheKey, JSON.stringify(parsedData));

                processAiResult(parsedData);
                setCustomAlert({ 
                    show: true, 
                    message: `Berhasil memindai resep menggunakan ${usedModelName}!`, 
                    type: 'success' 
                });

            } catch (error) {
                setCustomAlert({ 
                    show: true, 
                    message: `Gagal memindai resep: ${error.message}. Silakan isi detail resep secara manual.`, 
                    type: 'error' 
                });
            } finally {
                setIsScanning(false);
            }
        };
    };

    const processAiResult = (parsedData) => {
        let autoItems = [];
        let notFoundItems = [];
        const rawItems = parsedData.items || parsedData.medicines || parsedData.obat || [];

        if (Array.isArray(rawItems) && rawItems.length > 0) {
            rawItems.forEach(aiItem => {
                const rawName = (aiItem.name || aiItem.medicine_name || '').trim();
                if (!rawName) return;

                const firstWordMatch = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                
                const matchedMed = firstWordMatch.length >= 3 ? medicines.find(m => {
                    const mNameWord = m.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                    return mNameWord === firstWordMatch || 
                            (mNameWord.length >= 3 && (mNameWord.includes(firstWordMatch) || firstWordMatch.includes(mNameWord)));
                }) : null;

                if (matchedMed) {
                    autoItems.push({
                        medicine_id: matchedMed.id,
                        name: matchedMed.name,
                        sku: matchedMed.sku,
                        stock: matchedMed.stock,
                        quantity: parseInt(aiItem.quantity) || 1,
                        signa: aiItem.signa || '3 x 1 Tablet Sesudah Makan'
                    });
                } else {
                    notFoundItems.push(`${rawName} (Qty: ${aiItem.quantity || 1}, Signa: ${aiItem.signa || '-'})`);
                }
            });
        }

        setUnmatchedMedicines([...notFoundItems]);

        let warningText = '';
        if (notFoundItems.length > 0) {
            warningText = "PERINGATAN SISTEM (Obat Resep Tidak Terdaftar di Stok):\n- " + notFoundItems.join("\n- ");
        }

        const existingNotes = parsedData.notes || data.notes || '';
        const finalNotes = warningText 
            ? (existingNotes && !existingNotes.includes("PERINGATAN SISTEM") ? existingNotes + "\n\n" + warningText : warningText)
            : existingNotes;

        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(parsedData.prescription_date || '');

        setData(prev => ({
            ...prev,
            patient_name: parsedData.patient_name || prev.patient_name,
            doctor_name: parsedData.doctor_name ? formatDoctorName(parsedData.doctor_name) : prev.doctor_name,
            prescription_date: isValidDate ? parsedData.prescription_date : prev.prescription_date,
            notes: finalNotes,
            items: autoItems.length > 0 ? autoItems : prev.items
        }));
    };

    const handleAddItem = () => {
        if (!selectedMedicine || !quantity) {
            return setCustomAlert({ show: true, message: 'Pilih obat dan isi jumlahnya terlebih dahulu!', type: 'error' });
        }
        const medicine = medicines.find(m => m.id === parseInt(selectedMedicine));
        if (!medicine) return;
        
        const finalSigna = `${signaFreq} ${signaForm} ${signaTime}`;
        setData('items', [...data.items, { 
            medicine_id: medicine.id, 
            name: medicine.name, 
            sku: medicine.sku, 
            stock: medicine.stock,
            quantity: parseInt(quantity), 
            signa: finalSigna 
        }]);
        setSelectedMedicine(''); setQuantity(1);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) {
            return setCustomAlert({ show: true, message: 'Minimal harus ada 1 obat di dalam rincian resep!', type: 'error' });
        }
        post(route('prescriptions.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout header="Catat Resep Masuk">
            <Head title="Input Resep Baru" />

            <div className="max-w-5xl mx-auto space-y-6 relative">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">Formulir Resep Dokter</h2>
                    <Link href={route('prescriptions.index')} title="Batal & Kembali" className="p-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <PrescriptionFormHeader 
                        data={data} 
                        setData={setData} 
                        handleImageUpload={handleImageUpload} 
                        handleDoctorChange={handleDoctorChange} 
                        isScanning={isScanning} 
                        previewUrl={previewUrl}    
                        handleScanAI={handleScanAI}
                    />

                    <PrescriptionItemManager 
                        medicines={medicines}
                        data={data}
                        setData={setData}
                        unmatchedMedicines={unmatchedMedicines}
                        selectedMedicine={selectedMedicine}
                        setSelectedMedicine={setSelectedMedicine}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        signaFreq={signaFreq}
                        setSignaFreq={setSignaFreq}
                        signaForm={signaForm}
                        setSignaForm={setSignaForm}
                        signaTime={signaTime}
                        setSignaTime={setSignaTime}
                        handleAddItem={handleAddItem}
                        handleRemoveItem={handleRemoveItem}
                    />

                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-[#48CFA4] border-b border-gray-100 dark:border-gray-800 pb-2">Catatan Tambahan</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Keterangan / Catatan Resep</label>
                            <textarea 
                                className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" 
                                rows="3" 
                                value={data.notes || ''} 
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Tulis instruksi tambahan resep di sini..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="px-6 py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer">
                            {processing ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            )}
                            Simpan Resep Masuk
                        </button>
                    </div>
                </form>
            </div>

            <CustomAlertModal 
                show={customAlert.show} 
                message={customAlert.message} 
                type={customAlert.type} 
                onClose={() => setCustomAlert({ ...customAlert, show: false })} 
            />
        </AuthenticatedLayout>
    );
}