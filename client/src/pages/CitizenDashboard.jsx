import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Plus, Search, Calendar, Filter, Radar, FileText,
    ChevronRight, MapPin, ClipboardList, CheckCircle2
} from 'lucide-react';

import BackButton from '../components/BackButton';

const CitizenDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || (user && user.role !== 'Citizen')) {
            navigate('/citizen/login', { replace: true });
        }
    }, [navigate, user]);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const { data } = await api.get('/complaints/my');
                setComplaints(data);
            } catch {
                alert('Failed to load your complaints. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    if (loading) return (
        <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-govBlue/20 border-t-govBlue rounded-full animate-spin" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Data...</p>
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl animate-in fade-in duration-700">
            <BackButton />
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-1 w-8 bg-govBlue rounded-full"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Portal</p>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Welcome, {user?.name}</h1>
                    <p className="text-slate-500 font-bold text-sm">Real-time tracking of your reported grievances</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link to="/track" className="flex-1 md:flex-none border-2 border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
                        <Radar size={18} /> Track
                    </Link>
                    <Link to="/submit" className="flex-1 md:flex-none bg-govBlue text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 transition-all shadow-xl shadow-blue-100">
                        <Plus size={18} /> New Report
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
                <StatCard label="Total Filed" value={complaints.length} color="blue" icon={<Search size={20} />} />
                <StatCard label="In Progress" value={complaints.filter(c => c.status === 'In Progress').length} color="orange" icon={<Calendar size={14} />} />
                <StatCard label="Resolved" value={complaints.filter(c => c.status === 'Resolved').length} color="green" icon={<CheckCircle2 size={20} />} />
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ClipboardList size={18} className="text-govBlue" /> Recent History
                </h2>
            </div>

            {/* Complaints List/Cards */}
            <div className="space-y-4">
                {complaints.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {complaints.map((c) => (
                            <div
                                key={c._id}
                                onClick={() => navigate('/track', { state: { prefill: c.ticketId } })}
                                className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 hover:border-govBlue/20 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-6"
                            >
                                <div className="hidden sm:flex w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-govBlue transition-colors shadow-inner">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="font-mono text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">#{c.ticketId}</span>
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-govBlue rounded uppercase tracking-wider">{c.category}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${(c.priorityLevel || c.priority) === 'High' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                            {c.priorityLevel || c.priority || 'Medium'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-1 leading-snug group-hover:text-govBlue transition-colors truncate">{c.title}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(c.createdAt).toLocaleDateString()}</span>
                                        <span className="hidden sm:flex items-center gap-1.5 truncate max-w-[200px]"><MapPin size={14} /> {c.location?.address || 'No Location'}</span>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
                                    <div className="flex flex-col items-end">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${c.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' :
                                            c.status === 'In Progress' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-govBlue group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Plus size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2">No grievances found</h3>
                        <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">You haven't filed any complaints yet. Your history will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color, icon }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        green: 'bg-green-50 text-green-600 border-green-100',
    };
    return (
        <div className={`p-8 rounded-[2rem] border-2 shadow-sm bg-white hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative`}>
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all ${colors[color].split(' ')[1]}`}>
                {React.cloneElement(icon, { size: 64 })}
            </div>
            <div className="relative z-10 flex flex-col justify-center h-full">
                <div className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mb-2">{label}</div>
                <div className={`text-4xl font-black ${colors[color].split(' ')[1]} tracking-tighter`}>{value}</div>
            </div>
        </div>
    );
};

export default CitizenDashboard;
