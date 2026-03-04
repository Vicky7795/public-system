import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, BarChart3, Clock, ArrowRight, UserCircle, Briefcase } from 'lucide-react';
import api from '../utils/api';

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
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="bg-govBlue text-white py-24 px-6 relative overflow-hidden">
                {/* Background Watermark */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.07] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url('/src/assets/emblem-watermark.png')`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        maxHeight: '80%'
                    }}
                ></div>

                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-400 rounded-full blur-[120px] opacity-20"></div>
                <div className="container mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">AI Public Grievance <br /> Redressal System</h1>

                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <Link to="/citizen/register" className="group bg-white p-6 rounded-[2rem] hover:shadow-2xl transition-all border border-blue-100 flex items-center gap-6">
                            <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-govBlue group-hover:text-white transition-colors">
                                <UserCircle size={32} className="text-govBlue group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">For Citizens</p>
                                <p className="text-slate-800 font-bold text-lg leading-tight">Report & Track <br /> Grievances</p>
                            </div>
                            <ArrowRight size={20} className="text-slate-300 ml-auto group-hover:text-govBlue group-hover:translate-x-1 transition-all" />
                        </Link>

                        <Link to="/officer/login" className="group bg-slate-900 p-6 rounded-[2rem] hover:shadow-2xl transition-all border border-slate-800 flex items-center gap-6 text-white">
                            <div className="bg-slate-800 p-4 rounded-2xl group-hover:bg-white group-hover:text-slate-900 transition-colors">
                                <Briefcase size={32} className="text-white group-hover:text-slate-900" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Official Access</p>
                                <p className="font-bold text-lg leading-tight uppercase tracking-tighter">Duty Entry <br /> & Analytics</p>
                            </div>
                            <ArrowRight size={20} className="text-slate-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white border-b">
                <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
                    <StatItem value={stats.total} label="Total Grievances" />
                    <StatItem value={stats.accuracy} label="Classification Accuracy" />
                    <StatItem value={stats.resolved} label="Resolved Cases" />
                    <StatItem value={stats.responseTime} label="Avg Response Time" />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-slate-50 px-6">
                <div className="container mx-auto">
                    <h2 className="text-4xl font-black text-center mb-20 text-slate-800 tracking-tight uppercase">How it Works</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        <FeatureCard icon={<Cpu className="text-blue-600" size={40} />} title="AI Classification" desc="Our NLP model automatically assigns your complaint to the correct department." />
                        <FeatureCard icon={<ShieldCheck className="text-green-600" size={40} />} title="Smart Priority" desc="AI detects urgency based on code patterns and keywords to prioritize high-risk issues." />
                        <FeatureCard icon={<Clock className="text-orange-600" size={40} />} title="Real-time Tracking" desc="Monitor every stage of your grievance from submission to final resolution." />
                        <FeatureCard icon={<BarChart3 className="text-purple-600" size={40} />} title="Analytics Dashboard" desc="Officers get deep insights into complaint trends and department performance." />
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatItem = ({ value, label }) => (
    <div className="text-center group">
        <div className="text-5xl font-black text-govBlue mb-1 tracking-tighter group-hover:scale-110 transition-transform">{value}</div>
        <div className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">{label}</div>
    </div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="glass p-10 rounded-[2.5rem] shadow-sm border border-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
        <div className="mb-6 bg-white w-fit p-4 rounded-3xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
);

export default LandingPage;
