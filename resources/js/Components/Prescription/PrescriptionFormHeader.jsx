export default function PrescriptionFormHeader({ data, setData, handleImageUpload, handleDoctorChange, isScanning }) {
    return (
        <div className={`bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all relative ${isScanning ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
            {isScanning && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center font-bold text-[#48CFA4] bg-white/50 backdrop-blur-sm rounded-2xl">
                    <svg className="w-8 h-8 animate-spin mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Sedang Memindai Resep dengan AI...
                </div>
            )}
            
            <h3 className="text-sm font-bold text-[#48CFA4] mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">1. Upload & Ekstraksi AI</h3>
            <div className="mb-6">
                <input type="file" accept="image/*,.pdf" onChange={handleImageUpload} className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-[#EAF5F0] file:text-[#246A55] hover:file:bg-[#d8efe5] cursor-pointer" />
                <p className="text-[10px] text-gray-400 mt-1">*Upload foto resep fisik apa pun formatnya untuk pengisian otomatis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Pasien</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" value={data.patient_name} onChange={e => setData('patient_name', e.target.value)} required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Dokter</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-mono text-gray-800 dark:text-gray-200" value={data.doctor_name} onChange={handleDoctorChange} onBlur={handleDoctorChange} placeholder="dr. Nama" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
                    <input type="date" className="w-full bg-gray-50 dark:bg-[#151E24] border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200" value={data.prescription_date} onChange={e => setData('prescription_date', e.target.value)} required />
                </div>
            </div>
        </div>
    );
}