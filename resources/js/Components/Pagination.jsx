import { Link } from '@inertiajs/react';

/**
 * Navigasi halaman untuk paginator Laravel yang dikirim lewat Inertia.
 * `links` = paginator.links, `meta` = paginator (untuk "Menampilkan x-y dari z").
 */
export default function Pagination({ links = [], meta = null }) {
    if (!links || links.length <= 3) {
        return meta?.total > 0 ? (
            <p className="mt-4 text-center text-[11px] text-gray-400">Menampilkan {meta.from}–{meta.to} dari {meta.total} data</p>
        ) : null;
    }

    return (
        <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-1">
                {links.map((link, idx) => (
                    <Link
                        key={idx}
                        href={link.url || '#'}
                        preserveScroll
                        preserveState
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-3.5 py-2 text-xs rounded-xl font-bold transition-all ${
                            link.active
                                ? 'bg-[#48CFA4] text-white shadow-sm'
                                : link.url
                                ? 'bg-white dark:bg-[#1E272E] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#151E24]'
                                : 'opacity-40 cursor-not-allowed text-gray-400 pointer-events-none'
                        }`}
                    />
                ))}
            </div>
            {meta?.total > 0 && (
                <p className="text-[11px] text-gray-400">Menampilkan {meta.from}–{meta.to} dari {meta.total} data</p>
            )}
        </div>
    );
}
