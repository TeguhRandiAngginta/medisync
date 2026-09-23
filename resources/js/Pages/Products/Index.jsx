import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ products }) {
    return (
        <AuthenticatedLayout header="Katalog Produk & Obat">
            <Head title="Katalog Produk" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daftar Master Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Seluruh data SKU dibuat secara otomatis oleh sistem.</p>
                </div>
                {/* Memanggil komponen tombol yang bisa dipakai ulang */}
                <PrimaryButton as="link" href={route('products.create')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Tambah Produk
                </PrimaryButton>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-[#151E24] border-y border-gray-100 dark:border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-4 py-4 font-bold">SKU / Barcode</th>
                            <th className="px-4 py-4 font-bold">Nama Produk</th>
                            <th className="px-4 py-4 font-bold">Kategori</th>
                            <th className="px-4 py-4 font-bold">Konversi Satuan & Harga Jual</th>
                            <th className="px-4 py-4 font-bold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-16 text-center text-gray-400">Belum ada data produk</td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24] transition-colors">
                                    <td className="px-4 py-5 font-medium text-gray-900 dark:text-gray-200">{product.sku}</td>
                                    <td className="px-4 py-5 font-bold text-blue-600 dark:text-[#6FD8E8]">{product.name}</td>
                                    <td className="px-4 py-5 text-gray-600 dark:text-gray-400">{product.category?.name}</td>
                                    <td className="px-4 py-5">
                                        {/* Desain Kotak Satuan Bersekat */}
                                        <div className="flex flex-wrap gap-2">
                                            {product.product_units.map((pu) => (
                                                <div key={pu.id} className="text-[11px] bg-white dark:bg-[#253939] px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-[#30413B] shadow-sm flex items-center gap-1.5">
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{pu.unit?.name}</span>
                                                    <span className="text-gray-400 dark:text-gray-500">(Isi {pu.conversion_factor})</span>
                                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                                    <span className="font-semibold text-[#48CFA4] dark:text-[#67E2B4]">Rp {Number(pu.selling_price).toLocaleString('id-ID')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] text-[11px] font-bold px-2.5 py-1 rounded-full">Aktif</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}