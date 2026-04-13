import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheck, Cpu, BarChart3, Clock, ArrowRight, UserCircle, 
    Briefcase, Activity, Database, Zap, CheckCircle2, TrendingUp, PenLine
} from 'lucide-react';
import { 
    LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area 
} from 'recharts';
import api from '../utils/api';
import emblemWatermark from '../assets/emblem-watermark.png';

const LandingPage = () => {
    const [stats, setStats] = useState({
        total: '12,482',
        accuracy: '98.4%',
        resolved: '11,204',
        responseTime: '18h'
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
        <div className="flex flex-col bg-[#020617] text-white selection:bg-cyan-500/30">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
                {/* AI Network Background */}
                <div className="absolute inset-0 bg-ai-network opacity-30"></div>
                
                {/* Glowing Orbs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

                <div className="container mx-auto relative z-10">
                    <div className="text-center mb-20 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-8 animate-float">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Next-Gen AI Redressal Active
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                            The Future of <br className="hidden md:block" /> Public Trust.
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                            Experience a revolutionary grievance system powered by advanced NLP models, 
                            real-time analytics, and automated routing protocols.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <PortalCard 
                            type="citizen"
                            title="Citizen Portal"
                            subtitle="Report & Track Grievances"
                            icon={<UserCircle size={40} />}
                            links={[
                                { to: "/citizen/login", label: "Access Dashboard", primary: true },
                                { to: "/citizen/register", label: "Create Identity", primary: false }
                            ]}
                        />
                        <PortalCard 
                            type="official"
                            title="Official Portal"
                            subtitle="Department Duty Entry"
                            icon={<Briefcase size={40} />}
                            links={[
                                { to: "/officer/login", label: "Authorize Access", primary: true },
                                { to: "/officer/register", label: "Join Command", primary: false }
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section with Sparklines */}
            <section className="py-24 border-y border-white/5 relative bg-slate-950/50 backdrop-blur-sm">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                    <KPICard label="Total Grievances" value={stats.total} trend="+12%" data={generateSparkline()} />
                    <KPICard label="Classification Accuracy" value={stats.accuracy} trend="Fixed" data={generateSparkline(true)} />
                    <KPICard label="Resolved Cases" value={stats.resolved} trend="+8%" data={generateSparkline()} />
                    <KPICard label="Avg Response Time" value={stats.responseTime} trend="-2h" data={generateSparkline(false, true)} />
                </div>
            </section>

            {/* AI Intelligence & Insights Section */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">AI Intelligence <span className="text-cyan-500">&</span> Insights</h2>
                            <p className="text-slate-500 font-medium text-lg">Real-time oversight of system automation and performance</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            System Status: <span className="text-green-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Operational</span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Live AI Feed */}
                        <div className="lg:col-span-1 glass-dark rounded-[2.5rem] p-8 border border-white/10 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-3"><Activity className="text-cyan-500" size={20} /> Neural Activity</h3>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Stream</span>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                <ActivityItem time="2m ago" text="Grievance #8A12 classified to Municipal Department" highlight="98% confidence" />
                                <ActivityItem time="4m ago" text="High Priority incident detected in Water Sector" highlight="Critical" red />
                                <ActivityItem time="12m ago" text="Case #7F42 resolved by Revenue Officer" highlight="Resolution: 14h" />
                                <ActivityItem time="18m ago" text="Automated routing triggered for Transport issue" highlight="Success" />
                                <ActivityItem time="25m ago" text="Complaint analysis: PWD Sector - Road Damage" highlight="Verified" />
                                <ActivityItem time="30m ago" text="System optimized: NLP model v4.2 deployed" highlight="Performance: +4%" />
                                <ActivityItem time="45m ago" text="Grievance #8A11 classified to Health Department" highlight="Managed" />
                            </div>
                        </div>

                        {/* Interactive Analytics Preview */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass-dark rounded-[3rem] p-10 border border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Department Performance</h3>
                                        <p className="text-slate-500 text-xs font-medium">Monthly workload distribution across sectors</p>
                                    </div>
                                    <BarChart3 className="text-purple-500" size={24} />
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptData}>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {deptData.map((entry, index) => (
                                                    <rect key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-8">
                                    {deptData.map((d, i) => (
                                        <div key={i} className="text-center">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{d.name}</div>
                                            <div className="text-xs font-bold mt-1" style={{color: d.color}}>{d.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <HighlightCard label="92% AI Accuracy" desc="Industry leading classification via custom NLP" icon={<ShieldCheck className="text-cyan-500" />} />
                                <HighlightCard label="Auto Routing" desc="Zero latency department assignment protocols" icon={<Zap className="text-purple-500" />} />
                            </div>
                        </div>
                    </div>

                    {/* Smart Workflow Visualization */}
                    <div className="mt-32">
                        <h3 className="text-2xl font-black text-center mb-16 uppercase tracking-[0.4em] text-slate-700">Intelligent Pipeline</h3>
                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
                            {/* Connection Lines (SVG) */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent -translate-y-1/2 hidden md:block"></div>
                            
                            <WorkflowStep step="1" title="Submission" icon={<PenLine className="text-blue-400" size={24} />} active />
                            <WorkflowStep step="2" title="AI Analysis" icon={<Cpu className="text-cyan-400" size={24} />} active />
                            <WorkflowStep step="3" title="Priority Log" icon={<Activity className="text-purple-400" size={24} />} active />
                            <WorkflowStep step="4" title="Assignment" icon={<UserCircle className="text-indigo-400" size={24} />} active />
                            <WorkflowStep step="5" title="Resolution" icon={<CheckCircle2 className="text-green-400" size={24} />} active />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const PortalCard = ({ type, title, subtitle, icon, links }) => (
    <div className={`group relative p-10 rounded-[3rem] border transition-all duration-500 hover:-translate-y-2 ${type === 'citizen' ? 'glass-cyan' : 'glass-indigo'}`}>
        <div className="flex items-start justify-between mb-12">
            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all duration-500 group-hover:scale-110 ${type === 'citizen' ? 'bg-cyan-500 text-white' : 'bg-indigo-600 text-white'}`}>
                {icon}
            </div>
            <ArrowRight className={`text-white/20 transition-all duration-500 group-hover:translate-x-2 group-hover:text-white`} size={24} />
        </div>
        <div>
            <h3 className="text-4xl font-black tracking-tighter mb-2">{title}</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">{subtitle}</p>
        </div>
        <div className="flex gap-4 mt-12">
            {links.map((link, i) => (
                <Link key={i} to={link.to} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${link.primary ? (type === 'citizen' ? 'bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]') : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}`}>
                    {link.label}
                </Link>
            ))}
        </div>
    </div>
);

const KPICard = ({ label, value, trend, data }) => (
    <div className="glass-dark p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${trend.includes('+') ? 'text-green-400 bg-green-400/10' : trend === 'Fixed' ? 'text-cyan-400 bg-cyan-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                    {trend}
                </span>
            </div>
            <div className="text-4xl font-black tracking-tighter mb-6 group-hover:scale-105 transition-transform origin-left">{value}</div>
            <div className="h-[40px] w-full opacity-50 group-hover:opacity-100 transition-all">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="monotone" dataKey="v" stroke={trend.includes('+') ? '#4ade80' : '#06b6d4'} strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all"></div>
    </div>
);

const ActivityItem = ({ time, text, highlight, red }) => (
    <div className="flex gap-4 group p-3 hover:bg-white/5 rounded-2xl transition-colors">
        <div className="relative mt-1.5 ring-2 ring-slate-900 rounded-full h-fit">
            <div className={`w-2 h-2 rounded-full ${red ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}></div>
            <div className={`absolute inset-0 rounded-full animate-ping ${red ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
        </div>
        <div>
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{time}</div>
            <p className="text-sm font-medium text-slate-300 leading-tight mb-2">{text}</p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${red ? 'text-red-400 bg-red-400/10' : 'text-cyan-400 bg-cyan-400/10'}`}>{highlight}</span>
        </div>
    </div>
);

const HighlightCard = ({ label, desc, icon }) => (
    <div className="glass-dark p-6 rounded-3xl border border-white/5 flex gap-5 items-center hover:border-white/20 transition-all group">
        <div className="bg-white/5 p-4 rounded-2xl group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-white mb-1">{label}</h4>
            <p className="text-slate-500 text-xs font-medium">{desc}</p>
        </div>
    </div>
);

const WorkflowStep = ({ step, title, icon, active }) => (
    <div className="flex flex-col items-center group relative z-10 w-full min-w-[120px]">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 ${active ? 'bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-slate-900/50 grayscale opacity-40'}`}>
            {icon}
        </div>
        <div className="mt-6 text-center">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-1">Step {step}</span>
            <span className="font-black text-xs uppercase tracking-widest text-white">{title}</span>
        </div>
    </div>
);

// Helpers
const generateSparkline = (fixed, negative) => {
    return Array.from({length: 10}).map((_, i) => ({
        v: fixed ? 50 : (negative ? 100 - (i * 10) + Math.random() * 20 : i * 10 + Math.random() * 20)
    }));
};

const deptData = [
    { name: 'Water', value: 420, color: '#3b82f6' },
    { name: 'Power', value: 380, color: '#06b6d4' },
    { name: 'Roads', value: 510, color: '#8b5cf6' },
    { name: 'Police', value: 240, color: '#6366f1' },
    { name: 'Health', value: 310, color: '#f43f5e' },
    { name: 'Waste', value: 450, color: '#10b981' }
];

export default LandingPage;
