import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ExportModal from './Components/ExportModal';
import ReportTable from './Components/ReportTable';
import ReportCalendar from './Components/ReportCalendar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

export default function Index({ auth, filters, summary, salesList, calendarData, monthSales, calendarMonth, currentDate }) {
    const [startDate, setStartDate] = useState(filters?.start_date || currentDate);
    const [endDate, setEndDate] = useState(filters?.end_date || currentDate);
    const [activeView, setActiveView] = useState('table'); 
    const [selectedDate, setSelectedDate] = useState(null);
    
    // State Modal Export & Custom Notification
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState('pdf');
    const [selectedReportType, setSelectedReportType] = useState('sales');
    const [notification, setNotification] = useState(null);

    const showNotify = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleFilter = (period = 'custom') => {
        let params = { period };

        if (period !== 'custom' && period !== 'all') {
            const today = new Date();
            const formatD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            if (period === 'daily') {
                setStartDate(formatD(today));
                setEndDate(formatD(today));
                params = { ...params, start_date: formatD(today), end_date: formatD(today) };
            } 
        } else if (period === 'custom') {
            params = { ...params, start_date: startDate, end_date: endDate };
        }
        
        router.get(route('reports.index'), params, { preserveState: true });
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const setPresetDate = (preset) => {
        const today = new Date();
        if (preset === 'hari_ini') {
            const dateStr = formatDate(today);
            setStartDate(dateStr); 
            setEndDate(dateStr);
        } else if (preset === 'minggu_ini') {
            const firstDay = new Date(today);
            firstDay.setDate(today.getDate() - today.getDay() + 1);
            const lastDay = new Date(today);
            lastDay.setDate(today.getDate() - today.getDay() + 7);
            setStartDate(formatDate(firstDay)); 
            setEndDate(formatDate(lastDay));
        } else if (preset === 'bulan_ini') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setStartDate(formatDate(firstDay)); 
            setEndDate(formatDate(lastDay));
        } else if (preset === 'tahun_ini') {
            const firstDay = new Date(today.getFullYear(), 0, 1);
            const lastDay = new Date(today.getFullYear(), 11, 31);
            setStartDate(formatDate(firstDay)); 
            setEndDate(formatDate(lastDay));
        }
    };

    const handleExecuteExport = () => {
        setIsExportModalOpen(false);

        const exportUrl = route('reports.export', {
            type: selectedReportType,
            format: exportFormat,
            start_date: startDate,
            end_date: endDate
        });

        if (exportFormat === 'pdf') {
            showNotify(`Menyiapkan Cetak PDF Laporan ${selectedReportType.toUpperCase()}...`);
            
            const oldIframe = document.getElementById('print-iframe');
            if (oldIframe) oldIframe.remove();

            const iframe = document.createElement('iframe');
            iframe.id = 'print-iframe';
            iframe.style.display = 'none';
            iframe.src = exportUrl;
            document.body.appendChild(iframe);

        } else if (exportFormat === 'excel') {
            showNotify(`Memproses file Excel Laporan ${selectedReportType.toUpperCase()}...`);
            window.location.href = exportUrl;
        }
    };

    return (
        <AuthenticatedLayout header="Laporan Apotek">
            <Head title="Laporan & Rekapitulasi" />

            <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
                
                {notification && (
                    <div className="fixed top-5 right-5 z-50 bg-[#1E272E] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#48CFA4]/40 flex items-center gap-3 animate-in slide-in-from-top-5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#48CFA4] animate-pulse"></span>
                        <p className="text-xs font-bold">{notification}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Laporan & Rekapitulasi</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Medisync — Kelola dan ekspor data keuangan apotek Anda.</p>
                    </div>

                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 bg-[#48CFA4] hover:bg-[#3bb790] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        Export Laporan
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1E272E] p-4 rounded-[20px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4">
                    <div className="flex gap-1.5 w-full xl:w-auto overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                        {[{ key: 'daily', label: 'Harian' }, { key: 'weekly', label: 'Mingguan' }, { key: 'monthly', label: 'Bulanan' }, { key: 'yearly', label: 'Tahunan' }, { key: 'all', label: 'Seluruhnya' }].map((item) => (
                            <button 
                                key={item.key} 
                                onClick={() => handleFilter(item.key)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${filters?.period === item.key ? 'bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4]' : 'bg-gray-50 dark:bg-[#151E24] text-gray-600 dark:text-gray-400 hover:bg-gray-100'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-2 w-full xl:w-auto">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151E24] text-gray-700 dark:text-gray-200" />
                        <span className="text-gray-400 text-xs">s/d</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151E24] text-gray-700 dark:text-gray-200" />
                        <button onClick={() => handleFilter('custom')} className="px-4 py-2 bg-gray-800 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl hover:opacity-95">Cari</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Omzet (Pendapatan)</p>
                        <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">{formatRupiah(summary.total_sales)}</h4>
                    </div>
                    <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total HPP (Modal)</p>
                        <h4 className="text-xl font-extrabold text-orange-500 mt-1">{formatRupiah(summary.total_hpp)}</h4>
                    </div>
                    <div className="bg-[#48CFA4] p-5 rounded-2xl shadow-sm text-white relative overflow-hidden">
                        <p className="text-xs font-bold uppercase opacity-90 relative z-10">Laba Bersih</p>
                        <h4 className="text-xl font-extrabold mt-1 relative z-10">{formatRupiah(summary.profit)}</h4>
                    </div>
                    <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Transaksi</p>
                        <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">{summary.total_transactions} Struk</h4>
                    </div>
                    <div className="bg-white dark:bg-[#1E272E] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Stok Menipis</p>
                        <h4 className="text-xl font-extrabold text-red-500 mt-1">{summary.low_stock} Item</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E272E] rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-6">
                    <div className="border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/50 dark:bg-[#151E24]/30">
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Rincian Data</h3>
                        
                        <div className="flex bg-gray-100 dark:bg-[#151E24] p-1.5 rounded-xl gap-1">
                            <button onClick={() => setActiveView('table')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeView === 'table' ? 'bg-white dark:bg-[#1E272E] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            </button>
                            <button onClick={() => setActiveView('calendar')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeView === 'calendar' ? 'bg-white dark:bg-[#1E272E] text-[#48CFA4] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </button>
                        </div>
                    </div>

                    {activeView === 'table' ? (
                        <ReportTable salesList={salesList} formatRupiah={formatRupiah} />
                    ) : (
                        <ReportCalendar 
                            calendarMonth={calendarMonth}
                            calendarData={calendarData}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            monthSales={monthSales}
                            formatRupiah={formatRupiah}
                        />
                    )}
                </div>

                <ExportModal 
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    selectedReportType={selectedReportType}
                    setSelectedReportType={setSelectedReportType}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    exportFormat={exportFormat}
                    setExportFormat={setExportFormat}
                    handleExecuteExport={handleExecuteExport}
                    setPresetDate={setPresetDate}
                />

            </div>
        </AuthenticatedLayout>
    );
}