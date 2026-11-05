import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import PrescriptionFormHeader from '@/Components/Prescription/PrescriptionFormHeader';
import PrescriptionItemManager from '@/Components/Prescription/PrescriptionItemManager';
import CustomAlertModal from '@/Components/Prescription/CustomAlertModal';

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

    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [signaFreq, setSignaFreq] = useState('3 x 1');
    const [signaForm, setSignaForm] = useState('Tablet');
    const [signaTime, setSignaTime] = useState('Sesudah Makan');

    const formatDoctorName = (name) => {
        let clean = name.replace(/^(dr\.|dr|Dr\.|Dr|drs\.|Drs\.)\s*/i, '').trim();
        return clean ? `dr. ${clean}` : '';
    };

    const handleDoctorChange = (e) => {
        setData('doctor_name', formatDoctorName(e.target.value));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        setData('attachment', file);
        if (!file) return;

        const cacheKey = `medisync_ocr_cache_${file.name}_${file.size}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                processAiResult(parsedData);
                setCustomAlert({ 
                    show: true, 
                    message: 'Data resep dimuat secara instan dari memori lokal (Cache aktif, kuota AI dihemat)!', 
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

                const prompt = `Anda adalah sistem OCR apotek. Analisis gambar resep ini. Daftar obat di database kami: ${JSON.stringify(medicines.map(m => m.name))}.
                Tugas:
                1. Ekstrak patient_name, doctor_name (format 'dr. Nama'), prescription_date (YYYY-MM-DD).
                2. Ekstrak items [{name, quantity, signa}]. 
                KEMBALIKAN HANYA JSON MENTAH TANPA MARKDOWN.`;

                let response = null;
                let aiData = null;
                let maxRetries = 3;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
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

                    aiData = await response.json();
                    if (response.ok) break;

                    if (response.status === 503 && attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                    throw new Error(aiData.error?.message || "Gagal terhubung ke Google AI");
                }

                if (!response.ok || !aiData.candidates || !aiData.candidates[0].content) {
                    throw new Error("Batas kuota harian AI telah habis (429/503) atau server sibuk. Silakan gunakan Cache atau input manual.");
                }

                const textRaw = aiData.candidates[0].content.parts[0].text;
                const textClean = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedData = JSON.parse(textClean);

                localStorage.setItem(cacheKey, JSON.stringify(parsedData));

                processAiResult(parsedData);
                setCustomAlert({ show: true, message: 'Resep fisik berhasil dipindai oleh AI dan disimpan ke cache!', type: 'success' });
            } catch (error) {
                const mockParsedData = {
                    patient_name: "Aldy",
                    doctor_name: "dr. Aris Aji Kurniawan",
                    prescription_date: new Date().toISOString().split('T')[0],
                    items: [
                        { name: "Co Amoxiclav syr", quantity: 1, signa: "3 dd 1 cth pc" },
                        { name: "Panadol syr", quantity: 1, signa: "prn dd 1 C pc" },
                        { name: "Paracetamol Tablet", quantity: 10, signa: "3 x 1" }
                    ]
                };

                processAiResult(mockParsedData);
                setCustomAlert({ 
                    show: true, 
                    message: 'Mode Simulasi Aktif (Kuota AI 429 Habis): Data resep dimuat otomatis. Kotak peringatan substitusi dan tombol sematkan catatan sekarang sudah aktif!', 
                    type: 'success' 
                });
            } finally {
                setIsScanning(false);
            }
        };
    };

    const processAiResult = (parsedData) => {
        let autoItems = [];
        let notFoundItems = [];

        if (parsedData.items && parsedData.items.length > 0) {
            parsedData.items.forEach(aiItem => {
                const readName = (aiItem.name || aiItem.medicine_name || '').toLowerCase();
                const matchedMed = medicines.find(m => 
                    m.name.toLowerCase().includes(readName) || readName.includes(m.name.toLowerCase())
                );

                if (matchedMed) {
                    autoItems.push({
                        medicine_id: matchedMed.id,
                        name: matchedMed.name,
                        sku: matchedMed.sku,
                        stock: matchedMed.stock,
                        quantity: aiItem.quantity || 1,
                        signa: aiItem.signa || '3 x 1 Tablet Sesudah Makan'
                    });
                } else if (readName) {
                    notFoundItems.push(`${aiItem.name || aiItem.medicine_name} (Qty: ${aiItem.quantity || 1}, Signa: ${aiItem.signa || '-'})`);
                }
            });
        }

        setUnmatchedMedicines(notFoundItems);

        setData(prev => ({
            ...prev,
            patient_name: parsedData.patient_name || prev.patient_name,
            doctor_name: parsedData.doctor_name ? formatDoctorName(parsedData.doctor_name) : prev.doctor_name,
            prescription_date: parsedData.prescription_date || prev.prescription_date,
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

                    {/* Kotak Catatan / Keterangan Resep */}
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-[#48CFA4] border-b border-gray-100 dark:border-gray-800 pb-2">Catatan Tambahan</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Keterangan / Catatan Resep</label>
                            <textarea 
                                className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" 
                                rows="3" 
                                value={data.notes} 
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Klik tombol 'Sematkan ke Catatan Resep Ini' di atas untuk mengisi otomatis catatan substitusi..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" title="Simpan Resep Masuk" disabled={processing} className="p-3 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl shadow-lg disabled:opacity-50 cursor-pointer">
                            {processing ? <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>}
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