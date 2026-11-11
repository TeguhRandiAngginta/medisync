import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const Icons = {
    Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Audit: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    Logo: () => (
        <svg className="w-8 h-8 text-[#48CFA4]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a2 2 0 014 0v4h4a2 2 0 110 4h-4v4a2 2 0 11-4 0v-4H6a2 2 0 110-4h4V2z" />
        </svg>
    ),  
    Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    POS: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Inventaris: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    LokasiRak: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 3v18"></path><path d="M20 3v18"></path><path d="M4 8h16"></path><path d="M4 16h16"></path></svg>,
    Pembelian: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Resep: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Supplier: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    Laporan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    DataReference: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>,
    List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>,
    ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
    ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
    Sun: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>,
    Moon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>,
    User: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Logout: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};

export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash, errors } = usePage().props;
    const user = auth.user;
    const userRole = user?.role?.slug || 'superadmin'; 
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState('dashboard');
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [closingAmount, setClosingAmount] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [isClosingShift, setIsClosingShift] = useState(false);

    const handleCloseShift = (e) => {
        e.preventDefault();
        setIsClosingShift(true);
        
        router.post(route('pos.shift.close'), {
            closing_amount: closingAmount,
            notes: closingNotes
        }, {
            onSuccess: () => {
                setIsCloseShiftModalOpen(false);
                setClosingAmount('');
                setClosingNotes('');
            },
            onFinish: () => setIsClosingShift(false)
        });
    };

    useEffect(() => {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }

        const currentPath = route().current();
        if (currentPath?.startsWith('dashboard')) setOpenMenu('dashboard');
        else if (currentPath?.startsWith('references') || currentPath?.startsWith('racks') || currentPath?.startsWith('suppliers') || currentPath?.startsWith('products')) setOpenMenu('master');
        // DIPERBAIKI: Menambahkan pengecekan 'batches' agar menu Inventaris & Gudang tetap terbuka
        else if (currentPath?.startsWith('purchases') || currentPath?.startsWith('batches') || currentPath?.startsWith('stocks') || currentPath?.startsWith('audit-logs')) setOpenMenu('inventory');
        else if (currentPath?.startsWith('pos') || currentPath?.startsWith('prescriptions') || currentPath?.startsWith('sales')) setOpenMenu('transaction');
        else if (currentPath?.startsWith('reports') || currentPath?.startsWith('users')) setOpenMenu('system');
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

    const NavGroup = ({ id, label, icon: Icon, children }) => {
        const isOpen = openMenu === id;
        
        return (
            <div className="mb-2">
                <button 
                    onClick={() => setOpenMenu(isOpen ? '' : id)}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-200 group
                    ${isOpen 
                        ? 'bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] font-bold shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#212E36] font-medium'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <Icon />
                        <span className="text-[14px] tracking-wide text-left">{label}</span>
                    </div>
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#246A55] dark:text-[#67E2B4]' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400'}`}>
                        <Icons.ChevronRight />
                    </div>
                </button>
                
                <div className={`nav-dropdown-content overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-11 pr-2 py-2 space-y-1 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-100 dark:before:bg-gray-800 before:rounded-full">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const SubNavItem = ({ href, label, path, name }) => {
        const active = isActive(path);
        const targetHref = name ? (route().has(name) ? route(name) : '#') : href;

        return (
            <Link 
                href={targetHref} 
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-[13px] font-semibold relative
                ${active 
                    ? 'text-[#48CFA4] bg-white dark:bg-[#1E272E] shadow-sm border border-gray-100 dark:border-gray-800' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#212E36]'
                }`}
            >
                {active && (
                    <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-[#48CFA4] shadow-[0_0_8px_#48CFA4]"></span>
                )}
                {label}
            </Link>
        );
    };

    const SingleNavItem = ({ href, icon: Icon, label, path, id }) => {
        const active = isActive(path);
        return (
            <Link 
                href={href} 
                onClick={() => setOpenMenu(id)}
                className={`flex items-center justify-between px-5 py-3 mb-2 rounded-2xl transition-all duration-200 group
                    ${active 
                        ? 'bg-[#EAF5F0] dark:bg-[#253939] text-[#246A55] dark:text-[#67E2B4] font-bold shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#212E36] font-medium'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <Icon />
                    <span className="text-[14px] tracking-wide">{label}</span>
                </div>
            </Link>
        );
    };

    return (
        <div className={`h-screen w-full font-sans ${isDarkMode ? 'bg-[#151D23]' : 'bg-[#F4F7F6]'} flex transition-colors duration-300 overflow-hidden`}>
            
            {/* SIDEBAR */}
            <aside className={`w-[290px] h-full flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-colors duration-300 relative z-30
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
                    <SingleNavItem id="dashboard" href={route('dashboard')} path="dashboard" icon={Icons.Dashboard} label="Dashboard" />
                    {['apoteker', 'superadmin'].includes(userRole) && (
                        <NavGroup id="master" label="Data Master" icon={Icons.DataReference}>
                            {['superadmin'].includes(userRole) && (
                                <SubNavItem href={route('references.index')} path="references.*" label="Data Referensi" />
                            )}
                            <SubNavItem href={route('racks.index')} path="racks.*" label="Lokasi Rak" />
                            <SubNavItem href={route('suppliers.index')} path="suppliers.*" label="Pemasok / Supplier" />
                            <SubNavItem href={route('products.index')} path="products.*" label="Katalog Obat" />
                        </NavGroup>
                    )}
                    {['apoteker', 'superadmin'].includes(userRole) && (
                        <NavGroup id="inventory" label="Inventaris & Gudang" icon={Icons.Pembelian}>
                            <SubNavItem href={route('purchases.index')} path="purchases.*" label="Faktur Pembelian" />
                            <SubNavItem href={route('batches.index')} path="batches.*" label="Monitoring Batch & ED" />
                            {['superadmin'].includes(userRole) && (
                                <SubNavItem href={route('audit-logs.index')} path="audit-logs.*" label="Audit Log" />
                            )}
                        </NavGroup>
                    )}
                    {['kasir', 'apoteker', 'superadmin'].includes(userRole) && (
                        <NavGroup id="transaction" label="Transaksi & Layanan" icon={Icons.POS}>
                            <SubNavItem href={route('pos.index')} path="pos.*" label="Kasir (POS)" />
                            <SubNavItem href={route('prescriptions.index')} path="prescriptions.*" label="Resep Masuk" />
                            <SubNavItem href={route('sales.history')} path="sales.*" label="Riwayat Penjualan" />
                        </NavGroup>
                    )}
                    {['superadmin'].includes(userRole) && (
                        <NavGroup id="system" label="Sistem & Laporan" icon={Icons.Audit}>
                            <SubNavItem href={route('reports.index')} path="reports.*" label="Laporan Pembukuan" />
                            <SubNavItem href={route('users.index')} path="users.*" label="Manajemen Pengguna" />
                        </NavGroup>
                    )}
                </nav>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-3 bg-[#48CFA4]"></div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Pharmacy Management System</span>
                    </div>
                </div>
            </aside>

            {/* AREA KONTEN UTAMA */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className={`h-20 flex-shrink-0 flex items-center justify-between px-8 transition-colors duration-300 relative z-20
                    ${isDarkMode ? 'bg-[#1E272E] border-b border-gray-800' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-6">
                        {header && <h2 className={`text-xl font-bold hidden md:block ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{header}</h2>}
                        
                        {/* INDIKATOR SHIFT KASIR & TOMBOL TUTUP */}
                        {auth.active_shift && (
                            <div className="flex items-center gap-0">
                                <div className="flex items-center gap-2 bg-[#EAF5F0] dark:bg-[#253939] px-3 py-1.5 rounded-l-full border border-[#48CFA4]/30 border-r-0">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#48CFA4] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#48CFA4]"></span>
                                    </span>
                                    <span className="text-xs font-bold text-[#246A55] dark:text-[#67E2B4]">Shift Aktif</span>
                                </div>
                                <button 
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[11px] uppercase tracking-wider font-bold px-3 py-2 rounded-r-full shadow-sm transition-colors cursor-pointer"
                                >
                                    Tutup Shift
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <button type="button" onClick={toggleTheme} className={`p-2 rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                        </button>
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none cursor-pointer">
                                <div className="text-right hidden md:block">
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</p>
                                    <p className="text-xs text-[#48CFA4] uppercase font-semibold">{user.role?.name || 'Pengguna'}</p>
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

                <main className="flex-1 overflow-y-auto p-6 relative z-10">
                    {flash.success && (
                        <div className="mb-6 p-4 bg-[#EAF5F0] dark:bg-[#253939] border border-[#48CFA4]/30 text-[#246A55] dark:text-[#67E2B4] rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <h4 className="font-bold text-sm">Berhasil</h4>
                                <p className="text-xs mt-1 font-medium">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {errors?.message && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <div>
                                <h4 className="font-bold text-sm">Tindakan Ditolak / Gagal</h4>
                                <p className="text-xs mt-1 font-medium">{errors.message}</p>
                            </div>
                        </div>
                    )}

                    <div className={`min-h-full rounded-[24px] shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E272E] border-gray-800 text-gray-300' : 'bg-white border-gray-100 text-gray-700'}`}>
                        {children}
                    </div>
                </main>
            </div>
            {isCloseShiftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E272E] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Tutup Shift Kasir</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Hitung jumlah uang fisik di dalam laci kasir saat ini dan masukkan ke kolom di bawah untuk rekonsiliasi laporan.</p>
                        
                        <form onSubmit={handleCloseShift} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Total Uang Tunai Fisik (Rp) <span className="text-red-500">*</span></label>
                                <input 
                                    type="number" 
                                    min="0"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 font-mono text-base font-bold"
                                    value={closingAmount}
                                    onChange={e => setClosingAmount(e.target.value)}
                                    placeholder="Contoh: 1500000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Catatan Kasir (Opsional)</label>
                                <textarea 
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 text-sm resize-none h-20"
                                    value={closingNotes}
                                    onChange={e => setClosingNotes(e.target.value)}
                                    placeholder="Ada selisih uang atau kejadian khusus?"
                                ></textarea>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsCloseShiftModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isClosingShift}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    {isClosingShift ? 'Memproses...' : 'Akhiri Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}