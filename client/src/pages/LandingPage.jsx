import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, BarChart3, Clock, ArrowRight, UserCircle, Briefcase } from 'lucide-react';
import api from '../utils/api';
import emblemWatermark from '../assets/emblem-watermark.png';

const LandingPage = () => {
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
            <section className="bg-govBlue text-white py-24 px-6 relative overflow-hidden">
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
                    <h1 className="text-5xl md:text-7xl font-black mb-12 leading-tight tracking-tight">
                        AI Public Grievance <br /> Redressal System
                    </h1>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 flex flex-col items-center gap-6 text-center shadow-lg">
                            <div className="bg-blue-50 p-6 rounded-2xl">
                                <UserCircle size={48} className="text-govBlue" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-extrabold text-2xl tracking-tighter uppercase mb-2">Report & Track Grievances</h3>
                                <p className="text-slate-500 text-sm font-medium">Official channel for citizen complaints and monitoring</p>
                            </div>
                            <div className="flex gap-4 w-full justify-center">
                                <Link to="/citizen/login" className="bg-govBlue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors">
                                    Login
                                </Link>
                                <Link to="/citizen/register" className="bg-slate-100 text-govBlue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-blue-100 hover:bg-white transition-colors">
                                    Register
                                </Link>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 flex flex-col items-center gap-6 text-center shadow-lg text-white">
                            <div className="bg-slate-800 p-6 rounded-2xl">
                                <Briefcase size={48} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-2xl tracking-tighter uppercase mb-2">Official Duty Entry Portal</h3>
                                <p className="text-slate-400 text-sm font-medium">Secure access for government department officers</p>
                            </div>
                            <div className="flex gap-4 w-full justify-center">
                                <Link to="/officer/login" className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                    Enter
                                </Link>
                                <Link to="/officer/register" className="bg-slate-800 text-white/70 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-700 hover:text-white transition-colors">
                                    Join Desk
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatItem value={stats.total} label="Total Grievances" />
                        <StatItem value={stats.accuracy} label="Classification Accuracy" />
                        <StatItem value={stats.resolved} label="Resolved Cases" />
                        <StatItem value={stats.responseTime} label="Avg Response Time" />
                    </div>
                </div>
            </section>

            {/* Features / How It Works Section */}
            <section className="py-24 bg-white px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase mb-4">How it works</h2>
                        <div className="h-1.5 w-24 bg-govBlue mx-auto rounded-full"></div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard 
                            icon={<Cpu className="text-blue-600" size={32} />} 
                            title="AI Classification" 
                            desc="Automatic routing to the correct government department via machine learning." 
                        />
                        <FeatureCard 
                            icon={<ShieldCheck className="text-green-600" size={32} />} 
                            title="Smart Priority" 
                            desc="URGENCY detection based on AI analysis of complaint severity and type." 
                        />
                        <FeatureCard 
                            icon={<Clock className="text-orange-600" size={32} />} 
                            title="Real-time Tracking" 
                            desc="Monitor the status of your grievance from submission to final resolution." 
                        />
                        <FeatureCard 
                            icon={<BarChart3 className="text-purple-600" size={32} />} 
                            title="Analytics Dashboard" 
                            desc="Real-time insights and monitoring for department officials and admins." 
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatItem = ({ value, label }) => (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="text-4xl font-black text-govBlue mb-1 tracking-tighter">{value}</div>
        <div className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">{label}</div>
    </div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:bg-white hover:shadow-xl transition-all duration-300">
        <div className="mb-6 bg-white w-fit p-4 rounded-2xl shadow-sm border border-slate-100">{icon}</div>
        <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
);

export default LandingPage;
