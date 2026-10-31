import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#48CFA4', '#92EEFF', '#C4F7CA', '#E5E7EB'];

export default function TopProductsChart({ topProducts }) {
    return (
        <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Produk Terlaris</h3>
            {topProducts.length > 0 ? (
                <>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={1500}>
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {topProducts.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium truncate" title={item.name}>
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="truncate">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Belum ada data penjualan.</div>
            )}
        </div>
    );
}