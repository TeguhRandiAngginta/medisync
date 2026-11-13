import React, { useState } from 'react';
import axios from 'axios';

export default function ProductList({ 
    searchQuery, 
    setSearchQuery, 
    filteredMedicines, 
    addToCart, 
    setIsPrescriptionModalOpen 
}) {
    const [isAiMode, setIsAiMode] = useState(false);
    const [symptoms, setSymptoms] = useState('');
    const [isSearchingAi, setIsSearchingAi] = useState(false);
    const [aiResults, setAiResults] = useState(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiModalMessage, setAiModalMessage] = useState('');

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

    const handleAiSearch = async (e) => {
        if (e.key === 'Enter' && symptoms.trim() !== '') {
            setIsSearchingAi(true);
            setAiResults(null);
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error("VITE_GEMINI_API_KEY belum dikonfigurasi di .env");
                }

                const prompt = `Pasien mengeluh: '${symptoms}'. Berikan HANYA array JSON berisi maksimal 5 kata kunci (nama generik/kandungan/kategori) obat yang paling relevan untuk keluhan tersebut. Format wajib: ["paracetamol", "ibuprofen", "sirup batuk"]. Jangan berikan teks lain atau markdown.`;

                let keywords = [];
                const activeModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-lite-latest'];

                for (const model of activeModels) {
                    try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }]
                            })
                        });

                        const aiData = await response.json();
                        if (response.ok && aiData.candidates && aiData.candidates[0]?.content) {
                            const textRaw = aiData.candidates[0].content.parts[0].text;
                            const textClean = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                            keywords = JSON.parse(textClean);
                            if (Array.isArray(keywords) && keywords.length > 0) break;
                        }
                    } catch (err) {
                    }
                }

                if (!Array.isArray(keywords) || keywords.length === 0) {
                    keywords = [symptoms];
                }

                const matched = filteredMedicines.filter(med => {
                    const name = (med.name || '').toLowerCase();
                    const desc = (med.description || '').toLowerCase();
                    const cat = (med.category || '').toLowerCase();
                    return keywords.some(kw => {
                        const k = kw.toLowerCase();
                        return name.includes(k) || desc.includes(k) || cat.includes(k);
                    });
                });

                setAiResults(matched);
                if (matched.length === 0) {
                    setAiModalMessage(`AI merekomendasikan kandungan: ${keywords.join(', ')}, namun belum tersedia di stok apotek saat ini.`);
                    setShowAiModal(true);
                }
            } catch (error) {
                setAiModalMessage(`Gagal terhubung ke AI: ${error.message}`);
                setShowAiModal(true);
            } finally {
                setIsSearchingAi(false);
            }
        }
    };

    const displayMedicines = isAiMode && aiResults !== null ? aiResults : filteredMedicines;

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2d3748] overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 dark:border-[#2d3748] flex gap-2">
                {/* Toggle Mode Pencarian */}
                <button 
                    onClick={() => { setIsAiMode(!isAiMode); setAiResults(null); }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isAiMode 
                            ? 'bg-[#48CFA4] text-white shadow-sm' 
                            : 'bg-white dark:bg-[#2d3748] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#4a5568]'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    {isAiMode ? 'Mode AI' : 'Pencarian Biasa'}
                </button>

                <div className="relative flex-1">
                    {!isAiMode ? (
                        <input 
                            type="text" 
                            placeholder="Ketik nama obat, SKU..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a202c] border border-gray-200 dark:border-[#2d3748] rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#48CFA4]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    ) : (
                        <input 
                            type="text" 
                            placeholder="Ketik keluhan pasien (Cth: batuk berdahak) lalu tekan ENTER..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-[#EAF5F0] dark:bg-[#253939] border border-[#48CFA4]/30 rounded-xl text-[#246A55] dark:text-[#67E2B4] focus:ring-2 focus:ring-[#48CFA4] placeholder-[#48CFA4]/70"
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            onKeyDown={handleAiSearch}
                            disabled={isSearchingAi}
                        />
                    )}
                    <svg className={`w-5 h-5 absolute left-3 top-3.5 ${isAiMode ? 'text-[#48CFA4]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>

                <button 
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-gray-800 text-white hover:bg-gray-700 dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] cursor-pointer"
                >
                    Tarik Resep
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                {isSearchingAi && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-[#1E272E]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-[#EAF5F0] border-t-[#48CFA4] rounded-full animate-spin mb-3"></div>
                        <p className="text-[#48CFA4] font-bold text-sm">AI sedang menganalisis keluhan...</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayMedicines.map((medicine) => {
                        const isOutOfStock = (medicine.stock || 0) <= 0;
                        return (
                            <button 
                                key={medicine.id}
                                onClick={() => addToCart(medicine)}
                                disabled={isOutOfStock}
                                className={`flex flex-col justify-between p-4 text-left border rounded-xl transition-all group relative overflow-hidden ${
                                    isOutOfStock 
                                        ? 'bg-gray-50 dark:bg-[#1a202c]/50 border-gray-200 dark:border-[#2d3748] opacity-60 cursor-not-allowed' 
                                        : 'bg-white dark:bg-[#1a202c] border-gray-200 dark:border-[#4a5568] hover:border-[#48CFA4] dark:hover:border-[#48CFA4] cursor-pointer'
                                }`}
                            >
                                <div>
                                    <span className={`font-bold text-sm line-clamp-2 mb-1 ${isOutOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300 group-hover:text-[#48CFA4]'}`}>
                                        {medicine.name}
                                    </span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono block mb-2">{medicine.sku}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#2d3748] flex justify-between items-center w-full">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
                                        {formatRupiah(medicine.selling_price)}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                        isOutOfStock 
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-100 dark:text-gray-800'
                                    }`}>
                                        {isOutOfStock ? 'Habis' : `${medicine.stock} ${medicine.base_unit || 'Pcs'}`}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MODAL POP-UP KUSTOM UNTUK PESAN AI (Selaras dengan Tema Proyek) */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                            ⚠️
                        </div>
                        <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-100 mb-2">Informasi Sistem AI</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{aiModalMessage}</p>
                        <button 
                            onClick={() => setShowAiModal(false)}
                            className="w-full py-2.5 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            Mengerti & Lanjutkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}