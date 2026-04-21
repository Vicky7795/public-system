import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, ShieldCheck, Home, ClipboardList, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const token = localStorage.getItem('token');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        setIsMenuOpen(false);
    };

    const dashboardLink = user?.role === 'Citizen' ? '/dashboard' : (user?.role === 'Officer' ? '/officer' : '/admin');

    return (
        <nav className={`sticky top-0 z-[100] transition-all duration-300 ${scrolled
            ? 'bg-govBlue/90 backdrop-blur-md py-2 shadow-xl border-b border-white/10'
            : 'bg-govBlue py-4'
            }`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform group" onClick={() => setIsMenuOpen(false)}>
                    <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all shadow-lg">
                        <img src="/logo.png" alt="Government Logo" className="h-8 w-auto" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-xs uppercase tracking-widest leading-none mb-1">{t('common.branding.government')}</span>
                        <span className="text-white font-black text-[10px] sm:text-xs opacity-80 uppercase tracking-tighter">{t('common.branding.system_name')}</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex gap-4 items-center">
                    {token ? (
                        <>
                            <NavLink to={dashboardLink} icon={<LayoutDashboard size={16} />} text={t('common.auth.dashboard')} />
                            <div className="w-px h-6 bg-white/20 mx-2" />
                            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                                <span className="text-xs font-black uppercase tracking-widest text-blue-100">{user?.name}</span>
                                <button onClick={handleLogout} className="text-white/60 hover:text-red-400 transition-colors p-1">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-govBlue border-t border-white/10 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="p-6 space-y-4">
                        {token ? (
                            <>
                                <MobileNavLink to={dashboardLink} text={t('common.auth.dashboard')} onClick={() => setIsMenuOpen(false)} />
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">System Access</p>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/20"
                                    >
                                        <LogOut size={16} /> {t('common.auth.terminate')}
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </nav>
    );
};

const NavLink = ({ to, icon, text }) => (
    <Link to={to} className="flex items-center gap-2 px-4 py-2 rounded-2xl text-blue-100 hover:text-white hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest">
        {icon} {text}
    </Link>
);

const MobileNavLink = ({ to, text, onClick }) => (
    <Link to={to} onClick={onClick} className="block w-full text-white font-black text-sm uppercase tracking-widest p-4 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-all">
        {text}
    </Link>
);

export default Navbar;
