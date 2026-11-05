import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import PrescriptionItemManager from '@/Components/Prescription/PrescriptionItemManager';
import CustomAlertModal from '@/Components/Prescription/CustomAlertModal';

export default function Edit({ prescription, medicines }) {
    const { data, setData, put, processing, errors } = useForm({
        patient_name: prescription.patient_name || '',
        doctor_name: prescription.doctor_name || '',
        prescription_date: prescription.prescription_date || '',
        notes: prescription.notes || '',
        items: prescription.items.map(item => ({
            medicine_id: item.medicine_id,
            name: item.medicine?.name || 'Obat',
            sku: item.medicine?.sku || '',
            quantity: item.quantity,
            signa: item.signa
        }))
    });

    const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' });
    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [signaFreq, setSignaFreq] = useState('3 x 1');
    const [signaForm, setSignaForm] = useState('Tablet');
    const [signaTime, setSignaTime] = useState('Sesudah Makan');

    const handleAddItem = () => {
        if (!selectedMedicine || !quantity) {
            return setCustomAlert({ show: true, message: 'Pilih obat dan isi jumlahnya terlebih dahulu!', type: 'error' });
        }
        const medicine = medicines.find(m => m.id === parseInt(selectedMedicine));
        if (!medicine) return;
        
        const finalSigna = `${signaFreq} ${signaForm} ${signaTime}`;
        setData('items', [...data.items, { medicine_id: medicine.id, name: medicine.name, sku: medicine.sku, quantity: parseInt(quantity), signa: finalSigna }]);
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
        put(route('prescriptions.update', prescription.id));
    };

    return (
        <AuthenticatedLayout header="Edit Resep Masuk">
            <Head title={`Edit Resep ${prescription.prescription_number}`} />

            <div className="max-w-5xl mx-auto space-y-6 relative">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">Edit Resep: {prescription.prescription_number}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Perbarui informasi pasien atau rincian obat resep jika terdapat kesalahan.</p>
                    </div>
                    <Link href={route('prescriptions.index')} className="p-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Data Pasien */}
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-[#48CFA4] border-b border-gray-100 dark:border-gray-800 pb-2">1. Informasi Pasien & Dokter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pasien</label>
                                <input type="text" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" value={data.patient_name} onChange={e => setData('patient_name', e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Dokter</label>
                                <input type="text" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-mono text-gray-800 dark:text-gray-200" value={data.doctor_name} onChange={e => setData('doctor_name', e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                                <input type="date" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" value={data.prescription_date} onChange={e => setData('prescription_date', e.target.value)} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Catatan / Keterangan Tambahan</label>
                            <textarea className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" rows="2" value={data.notes} onChange={e => setData('notes', e.target.value)}></textarea>
                        </div>
                    </div>

                    {/* Rincian Item Obat */}
                    <PrescriptionItemManager 
                        medicines={medicines}
                        data={data}
                        setData={setData}
                        unmatchedMedicines={[]}
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

                    <div className="flex justify-end gap-3">
                        <Link href={route('prescriptions.index')} className="px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors flex items-center">Batal</Link>
                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-colors">
                            {processing ? 'Menyimpan...' : 'Perbarui Resep'}
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