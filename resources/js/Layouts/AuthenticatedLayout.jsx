import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const Icons = {
    Logo: () => (
        <svg className="w-8 h-8 text-[#48CFA4]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
        </svg>
    ),
    Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    POS: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Inventaris: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    LokasiRak: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 3v18"></path>
            <path d="M20 3v18"></path>
            <path d="M4 8h16"></path>
            <path d="M4 16h16"></path>
        </svg>
    ),
    Dokter: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
            <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
            <circle cx="20" cy="10" r="2"></circle>
        </svg>
    ),
    Pasien: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
    ),
    Pembelian: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Resep: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Supplier: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    Laporan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    Notifikasi: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    Chevron: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
    ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
    Sun: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>,
    Moon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>,
    User: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Logout: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // State untuk Dropdown

    useEffect(() => {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const isActive = (path) => route().current(path);

    const NavItem = ({ href, icon: Icon, label, path, badge = null }) => {
        const active = isActive(path);
        return (
            <Link 
                href={href} 
                className={`flex items-center justify-between px-5 py-3 mb-1.5 rounded-2xl transition-all duration-200 group
                    ${active 
                        ? 'bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] font-bold' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#212E36] font-medium'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <Icon />
                    <span className="text-[14px] tracking-wide">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {badge && (
                        <span className="bg-[#48CFA4] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {badge}
                        </span>
                    )}
                    <span className={`${active ? 'text-[#246A55] dark:text-[#67E2B4]' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400'}`}>
                        <Icons.Chevron />
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <div className={`h-screen w-full font-sans ${isDarkMode ? 'bg-[#151D23]' : 'bg-[#F4F7F6]'} flex transition-colors duration-300 overflow-hidden`}>
            
            {/* --- SIDEBAR --- */}
            <aside className={`w-[280px] h-full flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-colors duration-300 relative z-30
                ${isDarkMode ? 'bg-[#1E272E]' : 'bg-white'} hidden md:flex`}>
                
                <div className={`h-20 px-8 flex items-center gap-3 transition-colors duration-300
                    ${isDarkMode ? 'bg-[#151E24]' : 'bg-[#EBF7F2]'}`}>
                    <Icons.Logo />
                    <span className={`text-[17px] font-extrabold tracking-widest uppercase 
                        ${isDarkMode ? 'text-white' : 'text-[#1E3A34]'}`}>
                        MEDISYNC
                    </span>
                </div>
                
                <nav className="flex-1 px-4 pt-6 pb-4 overflow-y-auto custom-scrollbar">
                    {/* ... (Isi NavItem biarkan sama seperti sebelumnya) ... */}
                    <NavItem href={route('dashboard')} path="dashboard" icon={Icons.Dashboard} label="Dashboard" />
                    <NavItem href="#" path="pos.*" icon={Icons.POS} label="POS / Penjualan" />
                    <NavItem href={route('products.index')} path="products.*" icon={Icons.Inventaris} label="Inventaris" />
                    <NavItem href="#" path="purchases.*" icon={Icons.Pembelian} label="Pembelian" />
                    <NavItem href="#" path="prescriptions.*" icon={Icons.Resep} label="Resep" />
                    <NavItem href={route('suppliers.index')} path="suppliers.*" icon={Icons.Supplier} label="Supplier" />
                    <NavItem href={route('racks.index')} path="racks.*" icon={Icons.LokasiRak} label="Lokasi Rak" />
                    <NavItem href={route('doctors.index')} path="doctors.*" icon={Icons.Dokter} label="Direktori Dokter" />
                    <NavItem href={route('patients.index')} path="patients.*" icon={Icons.Pasien} label="Direktori Pasien" />
                    <NavItem href="#" path="reports.*" icon={Icons.Laporan} label="Laporan" />
                </nav>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-3 bg-[#48CFA4]"></div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Pharmacy Management System</span>
                    </div>
                </div>
            </aside>

            {/* --- KONTEN UTAMA --- */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className={`h-20 flex-shrink-0 flex items-center justify-between px-8 transition-colors duration-300 relative z-20
                    ${isDarkMode ? 'bg-[#1E272E] border-b border-gray-800' : 'bg-white shadow-sm'}`}>
                    
                    <div>
                        {header && <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{header}</h2>}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button type="button" onClick={toggleTheme} className={`p-2 rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                        </button>

                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none cursor-pointer">
                                <div className="text-right hidden md:block">
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</p>
                                    <p className="text-xs text-[#48CFA4] uppercase font-semibold">{user.role?.name || 'Apoteker'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-[#EAF5F0] border border-[#BDE8D9] flex items-center justify-center text-[#246A55] font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>
                                        <Icons.ChevronDown />
                                    </div>
                                </div>
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className={`absolute right-0 mt-4 w-48 rounded-2xl shadow-lg border py-2 z-40 transition-colors
                                        ${isDarkMode ? 'bg-[#1E2B27] border-[#30413B]' : 'bg-white border-gray-100'}`}>
                                        <Link href={route('profile.edit')} onClick={() => setIsProfileOpen(false)} className={`flex items-center px-5 py-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#253939] hover:text-[#67E2B4]' : 'text-gray-700 hover:bg-[#EAF5F0] hover:text-[#246A55]'}`}>
                                            <Icons.User /> Pengaturan
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className={`flex items-center w-full text-left px-5 py-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#253939] hover:text-red-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}>
                                            <Icons.Logout /> Log Out
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Konten Halaman Dibuat Penuh ke Bawah (Full Height) */}
                <main className="flex-1 overflow-y-auto p-6 relative z-10">
                    <div className={`min-h-full rounded-[24px] shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E272E] border-gray-800 text-gray-300' : 'bg-white border-gray-100 text-gray-700'}`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}