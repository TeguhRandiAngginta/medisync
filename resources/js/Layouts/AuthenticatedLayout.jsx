import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Komponen Ikon Kustom agar rapi
const Icons = {
    Logo: () => (
        <svg className="w-8 h-8 text-[#48CFA4]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
        </svg>
    ),
    Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    POS: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Inventaris: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    Pembelian: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Resep: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Supplier: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    Laporan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    Notifikasi: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    Pengaturan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Chevron: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
};

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Efek untuk mengaktifkan class 'dark' di elemen HTML utama
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const isActive = (path) => route().current(path);

    // Komponen Tombol Navigasi agar struktur HTML tidak berulang
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
        <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#151D23]' : 'bg-[#F4F7F6]'} flex transition-colors duration-300`}>
            
            {/* --- SIDEBAR --- */}
            <aside className={`w-[280px] flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-colors duration-300
                ${isDarkMode ? 'bg-[#1E272E]' : 'bg-white'}`}>
                
                {/* Header Logo dengan lengkungan (Curve) */}
                <div className={`relative h-[120px] px-8 pt-8 rounded-br-[2.5rem] transition-colors duration-300
                    ${isDarkMode ? 'bg-[#151E24]' : 'bg-[#EBF7F2]'}`}>
                    <div className="flex items-center gap-3">
                        <Icons.Logo />
                        <span className={`text-[17px] font-extrabold tracking-widest uppercase 
                            ${isDarkMode ? 'text-white' : 'text-[#1E3A34]'}`}>
                            MEDISYNC
                        </span>
                    </div>
                </div>
                
                {/* Menu List */}
                <nav className="flex-1 px-4 pt-6 overflow-y-auto custom-scrollbar">
                    <NavItem href={route('dashboard')} path="dashboard" icon={Icons.Dashboard} label="Dashboard" />
                    <NavItem href="#" path="pos.*" icon={Icons.POS} label="POS / Penjualan" />
                    <NavItem href={route('products.index')} path="products.*" icon={Icons.Inventaris} label="Inventaris" />
                    <NavItem href="#" path="purchases.*" icon={Icons.Pembelian} label="Pembelian" />
                    <NavItem href="#" path="prescriptions.*" icon={Icons.Resep} label="Resep" />
                    <NavItem href="#" path="suppliers.*" icon={Icons.Supplier} label="Supplier" />
                    <NavItem href="#" path="reports.*" icon={Icons.Laporan} label="Laporan" />
                    <NavItem href="#" path="notifications.*" icon={Icons.Notifikasi} label="Notifikasi" badge="3" />
                    <NavItem href="#" path="settings.*" icon={Icons.Pengaturan} label="Pengaturan" />
                </nav>

                {/* Footer Sidebar */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-3 bg-[#48CFA4]"></div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Pharmacy Management System</span>
                    </div>
                </div>
            </aside>

            {/* --- KONTEN UTAMA --- */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Topbar Sementara untuk Testing & Fitur Tambahan */}
                <header className={`h-20 flex items-center justify-between px-8 transition-colors duration-300
                    ${isDarkMode ? 'bg-[#1E272E] border-b border-gray-800' : 'bg-white shadow-sm'}`}>
                    
                    <div>
                        {header && <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{header}</h2>}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Tombol Toggle Light/Dark Mode (Fitur Ekstra) */}
                        <button 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {isDarkMode 
                                ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
                                : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                            }
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</p>
                                <p className="text-xs text-[#48CFA4] uppercase font-semibold">{user.role?.name || 'Apoteker'}</p>
                            </div>
                            <Link href={route('logout')} method="post" as="button" className="w-10 h-10 rounded-full bg-[#EAF5F0] border border-[#BDE8D9] flex items-center justify-center text-[#246A55] font-bold hover:bg-[#48CFA4] hover:text-white transition-colors">
                                {user.name.charAt(0)}
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}