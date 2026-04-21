import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCircle, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import emblemWatermark from '../assets/emblem-watermark.png';

const LandingPage = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        total: '...',
        accuracy: '92%',
        resolved: '...',
        responseTime: '...'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/complaints/public-stats');
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Hero Section */}
            <section className="bg-govBlue text-white py-24 px-4 sm:px-6 relative overflow-hidden">
                {/* Background Watermark */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.07] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url(${emblemWatermark})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        maxHeight: '80%'
                    }}
                ></div>

                <div className="container mx-auto text-center relative z-10">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-8 sm:mb-12 leading-tight tracking-tight px-4">
                        {t('landing.hero_title_1')} <br className="hidden sm:block" /> {t('landing.hero_title_2')}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
                        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 flex flex-col items-center gap-6 text-center shadow-lg">
                            <div className="bg-blue-50 p-6 rounded-2xl">
                                <UserCircle size={48} className="text-govBlue" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-extrabold text-2xl tracking-tighter uppercase mb-2">{t('landing.citizen_card_title')}</h3>
                                <p className="text-slate-500 text-sm font-medium">{t('landing.citizen_card_desc')}</p>
                            </div>
                            <div className="flex gap-4 w-full justify-center">
                                <Link to="/citizen/login" className="bg-govBlue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors">
                                    {t('common.auth.login')}
                                </Link>
                                <Link to="/citizen/register" className="bg-slate-100 text-govBlue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-blue-100 hover:bg-white transition-colors">
                                    {t('common.auth.register')}
                                </Link>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-800 flex flex-col items-center gap-6 text-center shadow-lg text-white">
                            <div className="bg-slate-800 p-6 rounded-2xl">
                                <Briefcase size={48} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-2xl tracking-tighter uppercase mb-2">{t('landing.officer_card_title')}</h3>
                                <p className="text-slate-400 text-sm font-medium">{t('landing.officer_card_desc')}</p>
                            </div>
                            <div className="flex gap-4 w-full justify-center">
                                <Link to="/officer/login" className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                    {t('landing.enter_btn')}
                                </Link>
                                <Link to="/officer/register" className="bg-slate-800 text-white/70 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-700 hover:text-white transition-colors">
                                    {t('landing.join_desk_btn')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        <StatItem value={stats.total} label={t('landing.stats.total')} />
                        <StatItem value={stats.accuracy} label={t('landing.stats.accuracy')} />
                        <StatItem value={stats.resolved} label={t('landing.stats.resolved')} />
                        <StatItem value={stats.responseTime} label={t('landing.stats.response_time')} />
                    </div>
                </div>
            </section>

        </div>
    );
};

const StatItem = ({ value, label }) => (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="text-4xl font-black text-govBlue mb-1 tracking-tighter">{value}</div>
        <div className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">{label}</div>
    </div>
);
export default LandingPage;
