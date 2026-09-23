import { Link } from '@inertiajs/react';

export default function PrimaryButton({ as = 'button', href, children, className = '', disabled, ...props }) {
    const baseClasses = 
        "px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed " +
        "bg-[#48CFA4] text-white hover:bg-[#3bb890] shadow-sm " +
        "dark:bg-[#253939] dark:text-[#67E2B4] dark:hover:bg-[#2d4747] dark:border dark:border-[#30413B] dark:shadow-none ";

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