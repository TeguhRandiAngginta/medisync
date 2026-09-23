import { Link } from '@inertiajs/react';

export default function PrimaryButton({ as = 'button', href, children, className = '', disabled, ...props }) {
    const baseClasses = "px-6 py-2.5 bg-[#48CFA4] text-white rounded-full hover:bg-[#3bb890] text-sm font-bold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ";

    if (as === 'link') {
        return (
            <Link href={href} className={baseClasses + className} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button disabled={disabled} className={baseClasses + className} {...props}>
            {children}
        </button>
    );
}