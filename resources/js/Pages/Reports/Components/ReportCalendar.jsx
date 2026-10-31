import React from 'react';

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

export default function ReportCalendar({ 
    calendarMonth, 
    calendarData, 
    selectedDate, 
    setSelectedDate, 
    monthSales, 
    formatRupiah 
}) {
    const calDate = calendarMonth ? new Date(calendarMonth) : new Date();
    const currentYear = isNaN(calDate.getFullYear()) ? new Date().getFullYear() : calDate.getFullYear();
    const currentMonth = isNaN(calDate.getMonth()) ? new Date().getMonth() : calDate.getMonth();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const monthName = calDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const selectedDateTransactions = selectedDate && monthSales
        ? monthSales.filter(sale => sale.sale_date.startsWith(selectedDate))
        : [];

    return (
        <div className="p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Bulan: <span className="text-[#48CFA4]">{monthName}</span></h3>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="text-xs font-extrabold text-gray-400 uppercase tracking-wider py-2">{day}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 md:h-28 rounded-2xl bg-gray-50/50 dark:bg-[#151E24]/30"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const hasData = calendarData && calendarData[dateStr];

                    return (
                        <button 
                            key={dayNum} 
                            disabled={!hasData}
                            onClick={() => hasData && setSelectedDate(dateStr)}
                            className={`h-24 md:h-28 rounded-2xl border p-2 md:p-3 flex flex-col justify-between transition-all w-full text-left
                                ${hasData 
                                    ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:border-[#48CFA4] border-[#48CFA4]/40 bg-[#EAF5F0]/40 dark:bg-[#253939]/40' 
                                    : 'cursor-default border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E272E]'
                                }`}
                        >
                            <div className="flex justify-between items-start w-full">
                                <span className={`text-sm font-extrabold ${hasData ? 'text-[#246A55] dark:text-[#67E2B4]' : 'text-gray-400'}`}>{dayNum}</span>
                                {hasData && <span className="w-2 h-2 rounded-full bg-[#48CFA4]"></span>}
                            </div>
                            {hasData && (
                                <div className="mt-auto w-full">
                                    <div className="text-[10px] text-gray-600 dark:text-[#48CFA4] font-bold truncate mb-0.5">{hasData.transactions} Struk</div>
                                    <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{formatRupiah(hasData.revenue)}</div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* MODAL TRANSAKSI KALENDER */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E272E] rounded-[24px] w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#151E24]/50 rounded-t-[24px]">
                            <div>
                                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Rincian Tanggal <span className="text-[#48CFA4]">{selectedDate}</span></h3>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="w-8 h-8 rounded-full bg-white dark:bg-[#2A343D] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 cursor-pointer">
                                ✕
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 custom-scrollbar space-y-3">
                            {selectedDateTransactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-[#151E24]">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white font-mono">{tx.invoice_number}</h4>
                                        <p className="text-xs text-gray-500 font-medium">Kasir: {tx.user?.name || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-extrabold text-gray-900 dark:text-[#48CFA4]">{formatRupiah(tx.total_amount)}</div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{tx.payment_method}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}