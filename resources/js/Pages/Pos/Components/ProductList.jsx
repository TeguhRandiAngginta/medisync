import React from 'react';

export default function ProductList({ 
    searchQuery, 
    setSearchQuery, 
    filteredMedicines, 
    addToCart, 
    setIsPrescriptionModalOpen 
}) {
    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1E272E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Scan Barcode atau ketik nama obat, SKU..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#151E24] border-none rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#48CFA4]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <button 
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="px-4 py-3 bg-[#48CFA4] hover:bg-[#3AB890] text-white rounded-xl font-bold text-sm shadow-sm whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Tarik Resep
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMedicines.map((medicine) => (
                        <button 
                            key={medicine.id}
                            onClick={() => addToCart(medicine)}
                            className="flex flex-col p-4 text-left border border-gray-100 dark:border-gray-800 rounded-xl hover:border-[#48CFA4] hover:bg-[#EAF5F0] dark:hover:bg-[#253939] transition-all group cursor-pointer"
                        >
                            <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#246A55] dark:group-hover:text-[#48CFA4] line-clamp-2">{medicine.name}</span>
                            <span className="text-xs text-gray-500 mt-1">{medicine.sku}</span>
                        </button>
                    ))}
                </div>
                {filteredMedicines.length === 0 && (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm font-bold">
                        Obat tidak ditemukan.
                    </div>
                )}
            </div>
        </div>
    );
}