import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ products }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Katalog Produk & Obat</h2>}
        >
            <Head title="Katalog Produk" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            
                            <div className="mb-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-700">Daftar Master Data</h3>
                                <Link 
                                    href={route('products.create')} 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold"
                                >
                                    + Tambah Produk
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">SKU / Barcode</th>
                                            <th className="px-4 py-3">Nama Produk</th>
                                            <th className="px-4 py-3">Kategori</th>
                                            <th className="px-4 py-3">Konversi Satuan & Harga Jual</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-400">Belum ada data produk</td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{product.sku}</td>
                                                    <td className="px-4 py-3 font-bold text-blue-600">{product.name}</td>
                                                    <td className="px-4 py-3">{product.category?.name}</td>
                                                    <td className="px-4 py-3">
                                                        <ul className="space-y-1">
                                                            {product.product_units.map((pu) => (
                                                                <li key={pu.id} className="text-xs bg-blue-50 px-2 py-1 rounded inline-block mr-2 mb-1 border border-blue-100">
                                                                    <span className="font-bold">{pu.unit?.name}</span> (Isi {pu.conversion_factor}) - 
                                                                    Rp {Number(pu.selling_price).toLocaleString('id-ID')}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {product.is_active ? 
                                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Aktif</span> : 
                                                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Nonaktif</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}