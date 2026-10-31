import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function SalesChart({ chartData, currentFilter, onFilterChange }) {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Tren Penjualan</h3>
                <div className="flex flex-wrap gap-1.5">
                    {['daily', 'weekly', 'monthly', 'yearly'].map((period) => {
                        const labels = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' };
                        const isActive = currentFilter === period || (!currentFilter && period === 'daily');
                        return (
                            <button 
                                key={period}
                                onClick={() => onFilterChange(period)} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all ${isActive ? 'bg-[#48CFA4] text-white' : 'bg-gray-50 dark:bg-[#151E24] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                                {labels[period]}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#48CFA4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#48CFA4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(value) => `Rp${value/1000}k`} />
                        <Tooltip 
                            formatter={(value) => formatRupiah(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-bg-opacity, white)' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#48CFA4" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" animationDuration={1500} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}