import { Link } from '@inertiajs/react';

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function RecentTransactions({ recentTransactions, paymentDistribution }) {
    const getPaymentPercentage = (methodKey) => {
        if (!paymentDistribution) return 0;

        if (paymentDistribution[methodKey]?.percentage) {
            return paymentDistribution[methodKey].percentage;
        }

        const foundKey = Object.keys(paymentDistribution).find(
            k => k.toUpperCase().includes(methodKey.toUpperCase())
        );

        return foundKey ? paymentDistribution[foundKey].percentage : 0;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#1E272E] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Transaksi Terbaru</h3>
                    <Link href={route('sales.history')} className="text-xs font-bold text-[#48CFA4] hover:underline">Lihat Semua</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-[#151E24] text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Metode</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-[#151E24]">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-800 dark:text-gray-200">{tx.invoice_number}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">{tx.payment_method}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{tx.user?.name}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{formatRupiah(tx.total_amount)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Belum ada transaksi selesai.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-6">Distribusi Pembayaran</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-600 dark:text-gray-300">QRIS</span>
                            <span className="text-gray-800 dark:text-gray-100">{getPaymentPercentage('QRIS')}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div className="bg-[#48CFA4] h-2 rounded-full transition-all duration-1000" style={{ width: `${getPaymentPercentage('QRIS')}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-600 dark:text-gray-300">Tunai (CASH)</span>
                            <span className="text-gray-800 dark:text-gray-100">{getPaymentPercentage('CASH')}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div className="bg-[#92EEFF] h-2 rounded-full transition-all duration-1000" style={{ width: `${getPaymentPercentage('CASH')}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-gray-600 dark:text-gray-300">Transfer</span>
                            <span className="text-gray-800 dark:text-gray-100">{getPaymentPercentage('TRANSFER')}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div className="bg-[#C4F7CA] h-2 rounded-full transition-all duration-1000" style={{ width: `${getPaymentPercentage('TRANSFER')}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}