import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Clock, CheckCircle2, AlertCircle, MapPin, Camera,
    MessageSquare, TrendingUp, Calendar, Users, Activity,
    ChevronRight, Search, FileText, ShieldCheck, ArrowRight,
    Navigation, Loader2, ListFilter, X, ExternalLink, Maximize2, Zap
} from 'lucide-react';

import BackButton from '../components/BackButton';
import SummaryCard from '../components/SummaryCard';
import NotificationCenter from '../components/NotificationCenter';

const OfficerDashboard = () => {
    const [view, setView] = useState('mine'); // 'mine' or 'pool'
    const [complaints, setComplaints] = useState([]);
    const [pool, setPool] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [stats, setStats] = useState({ total: 0, overdue: 0, inProgress: 0, resolved: 0, poolCount: 0 });
    const [selectedId, setSelectedId] = useState(null);
    const [modal, setModal] = useState(null);
    const [progressInput, setProgressInput] = useState({ progress: 0, note: '' });
    const [resolveInput, setResolveInput] = useState({ resolutionNote: '', proofImage: '' });
    const [directResolveInput, setDirectResolveInput] = useState({ resolutionNote: '', proofImage: '' });
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false); // Toggle for translation
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || user?.role !== 'Officer') {
            navigate('/officer/login');
        }
    }, [navigate, user]);

    const fetchData = async () => {
        try {
            setFetchError('');
            const [mineRes, poolRes] = await Promise.all([
                api.get('/complaints/assigned'),
                api.get('/complaints/unassigned')
            ]);

            setComplaints(mineRes.data);
            setPool(poolRes.data);

            const now = new Date();
            setStats({
                total: mineRes.data.length,
                overdue: mineRes.data.filter(c => c.status !== 'Resolved' && new Date(c.slaDeadline) < now).length,
                inProgress: mineRes.data.filter(c => c.status === 'In Progress').length,
                resolved: mineRes.data.filter(c => c.status === 'Resolved').length,
                poolCount: poolRes.data.length
            });
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Could not sync with central server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Short-poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handleAccept = async (id) => {
        try {
            await api.patch(`/complaints/${id}/accept`);
            await fetchData();
            setView('mine');
        } catch {
            setFetchError('Assignment failed.');
        }
    };

    const handleUpdateProgress = async () => {
        try {
            await api.patch(`/complaints/${selectedId}/progress`, progressInput);
            setModal(null);
            fetchData();
        } catch {
            setFetchError('Update failed.');
        }
    };

    const handleResolve = async () => {
        if (!resolveInput.proofImage || !resolveInput.resolutionNote) {
            setFetchError('Note and proof are required for closure.');
            return;
        }
        try {
            await api.patch(`/complaints/${selectedId}/resolve`, resolveInput);
            setModal(null);
            fetchData();
        } catch {
            setFetchError('Closure failed.');
        }
    };

    const handleDirectResolve = async () => {
        if (!directResolveInput.resolutionNote) {
            setFetchError('Resolution note is required.');
            return;
        }
        try {
            await api.patch(`/complaints/${selectedId}/accept-and-resolve`, directResolveInput);
            setModal(null);
            setDirectResolveInput({ resolutionNote: '', proofImage: '' });
            await fetchData();
        } catch {
            setFetchError('Resolution failed.');
        }
    };

    const handleFileChange = (e, target) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'resolve') setResolveInput({ ...resolveInput, proofImage: reader.result });
            if (target === 'direct') setDirectResolveInput({ ...directResolveInput, proofImage: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const getTimeLeft = (deadline) => {
        if (!deadline) return { text: 'N/A', classes: 'text-gray-400' };
        const diff = new Date(deadline) - new Date();
        if (diff < 0) return { text: 'OVERDUE', classes: 'text-red-600 font-black px-2 py-0.5 bg-red-50 rounded' };
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return { text: `${hours}h LEFT`, classes: 'text-orange-600 font-bold' };
        return { text: `${Math.floor(hours / 24)}d LEFT`, classes: 'text-gray-600 font-semibold' };
    };

    if (loading) return (
        <div className="flex flex-col h-[80vh] items-center justify-center gap-4 bg-[#F9FAFB]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1D4ED8] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Initialising Secure Terminal...</p>
        </div>
    );

    const baseList = view === 'mine' ? complaints : pool;
    const activeList = baseList.filter(c => {
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase().trim();
        return c.ticketId?.toLowerCase().includes(q) ||
               c.title?.toLowerCase().includes(q) ||
               c.status?.toLowerCase().includes(q) ||
               c.category?.toLowerCase().includes(q);
    });

    return (
        <div className="min-h-screen bg-[#F9FAFB] pb-20">
            {/* Top Branding Bar */}
            <div className="bg-white border-b border-gray-200 py-3 mb-8">
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] hidden sm:block">Officer Terminal • Operational Unit</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationCenter />
                        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                            <Activity size={12} className="text-[#1D4ED8]" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{stats.inProgress} active cases</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1D4ED8] rounded-lg border border-blue-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Secured Access</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl animate-in fade-in duration-500">
                {/* Header & View Switcher */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                    <div>
                        <p className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-[0.3em] mb-1">Field Management System</p>
                        <h1 className="text-3xl font-bold text-[#111827] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">Welcome, {user?.name}</h1>
                        <p className="text-sm text-gray-500 font-medium">Departmental Intelligence Dashboard</p>
                    </div>
                    
                    <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm self-stretch lg:self-auto">
                        <button
                            onClick={() => setView('mine')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'mine' ? 'bg-[#1D4ED8] text-white shadow-md' : 'text-gray-400 hover:text-gray-700'}`}
                        >
                            Assigned Flow ({stats.total})
                        </button>
                        <button
                            onClick={() => setView('pool')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'pool' ? 'bg-[#1D4ED8] text-white shadow-md' : 'text-gray-400 hover:text-gray-700'}`}
                        >
                            Intake Pool ({stats.poolCount})
                        </button>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <SummaryCard label="Pending Orders" value={stats.total} color="blue" icon={<FileText size={20} />} />
                    <SummaryCard label="Regional Pool" value={stats.poolCount} color="purple" icon={<Users size={20} />} />
                    <SummaryCard label="In-Operation" value={stats.inProgress} color="orange" icon={<Activity size={20} />} />
                    <SummaryCard label="Resolved" value={stats.resolved} color="green" icon={<CheckCircle2 size={20} />} />
                </div>

                {/* Filter / Search Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Title, Status or Category..."
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Task List Container */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-10">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ListFilter size={14} />
                            {view === 'mine' ? 'Current Assigned Operations' : 'Unassigned Citizen Grievances'} 
                            ({activeList.length})
                        </h3>
                        {fetchError && <span className="text-xs font-bold text-red-500 px-3 py-1 bg-red-50 rounded-lg animate-pulse">{fetchError}</span>}
                    </div>

                    <div className="divide-y divide-gray-100">
                        {activeList.length > 0 ? (
                            activeList.map((c) => (
                                <div key={c._id} className="lg:grid lg:grid-cols-12 items-center px-6 py-6 hover:bg-gray-50/50 transition-colors group">
                                    {/* ID & Priority */}
                                    <div className="col-span-2 mb-4 lg:mb-0">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-mono text-[11px] font-black text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">#{c.ticketId}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit uppercase tracking-tighter ${c.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                {c.priority} Priority
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-5 mb-6 lg:mb-0">
                                        <div className="pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#1D4ED8] transition-colors truncate" title={c.title}>{c.title}</h4>
                                                {c.language && c.language !== 'en' && <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex-shrink-0">Translated</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium line-clamp-1 leading-relaxed mb-2">{c.description}</p>
                                            <button 
                                                onClick={() => { setSelectedComplaint(c); setModal('detail'); }}
                                                className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest"
                                            >
                                                Audit Operational Details <ChevronRight size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Location & Time */}
                                    <div className="col-span-3 mb-6 lg:mb-0 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} className="text-gray-400 shrink-0" />
                                            <span className="text-[11px] font-bold text-gray-600 truncate" title={c.location?.address}>{c.location?.address || 'GPS COORDINATES ABSENT'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-gray-400 shrink-0" />
                                            <span className={`text-[11px] ${getTimeLeft(c.slaDeadline).classes}`}>
                                                {getTimeLeft(c.slaDeadline).text}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions Vertical Group */}
                                    <div className="col-span-2 flex flex-col gap-2">
                                        {view === 'pool' ? (
                                            <>
                                                <button onClick={() => handleAccept(c._id)} className="w-full py-2 bg-[#1D4ED8] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#1e40af] transition-all shadow-sm">Claim assignment</button>
                                                <button onClick={() => { setSelectedId(c._id); setModal('directResolve'); }} className="w-full py-2 border border-green-200 text-green-700 bg-green-50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all">Direct resolve</button>
                                            </>
                                        ) : (
                                            <>
                                                {(c.status === 'Pending' || c.status === 'Reopened') && (
                                                    <button onClick={() => handleAccept(c._id)} className="w-full py-2.5 bg-[#1D4ED8] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#1e40af] transition-all">Start Operation</button>
                                                )}
                                                {(c.status === 'In Progress' || c.status === 'Assigned') && (
                                                    <>
                                                        <div className="flex items-center justify-between mb-1 px-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{c.progress || 0}%</span>
                                                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-govBlue" style={{ width: `${c.progress || 0}%` }} />
                                                            </div>
                                                        </div>
                                                        <button onClick={() => { setSelectedId(c._id); setModal('progress'); setProgressInput({ progress: c.progress || 0, note: '' }) }}
                                                            className="w-full py-2 border border-gray-200 text-gray-600 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Log progress</button>
                                                        <button onClick={() => { setSelectedId(c._id); setModal('resolve'); }}
                                                            className="w-full py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm">Seal & Close</button>
                                                    </>
                                                )}
                                                {c.status === 'Resolved' && (
                                                    <div className="w-full py-2.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-center border border-green-100">Closed ✓</div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <Search size={40} className="mx-auto text-gray-200 mb-4" />
                                <h4 className="text-lg font-bold text-gray-900">Zero Active Reports</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">No results found matching your search or filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS - Redesigned for Official Registry Style */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className={`${modal === 'detail' ? 'max-w-3xl' : 'max-w-lg'} bg-white rounded-2xl p-8 w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 overflow-y-auto max-h-[90vh]`}>
                        <header className="flex justify-between items-center mb-6 pb-4 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                                    {modal === 'progress' ? 'Update Operational Progress' : 
                                     modal === 'detail' ? 'Operational Intelligence Report' : 
                                     'Incident Closure Certification'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Grievance Terminal #{selectedComplaint?.ticketId || '6493'}
                                </p>
                            </div>
                            <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </header>

                        <div className="space-y-6">
                            {modal === 'detail' && selectedComplaint && (
                                <div className="space-y-8">
                                    {/* Primary Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Issue Title</p>
                                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{selectedComplaint.title}</h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedComplaint.category}</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedComplaint.priorityLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {selectedComplaint.priorityLevel || 'Medium'} Priority
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Briefing</p>
                                                    {selectedComplaint.language && selectedComplaint.language !== 'en' && (
                                                        <button 
                                                            onClick={() => setShowOriginal(!showOriginal)}
                                                            className="text-[10px] uppercase font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                                                        >
                                                            {showOriginal ? 'View English Translation' : 'View Citizen Original Text'}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                                                    {showOriginal && selectedComplaint.originalText ? selectedComplaint.originalText : selectedComplaint.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {selectedComplaint.imageData ? (
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Visual Evidence</p>
                                                    <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(!isZoomed)}>
                                                        <img 
                                                            src={selectedComplaint.imageData} 
                                                            alt="Complaint evidence" 
                                                            className={`w-full ${isZoomed ? 'object-contain h-auto max-h-[400px]' : 'h-48 object-cover'} rounded-xl border border-slate-200 transition-all shadow-sm`}
                                                        />
                                                        {!isZoomed && (
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                                                <Maximize2 size={24} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <Camera size={32} strokeWidth={1} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Visual Assets</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Location Intelligence */}
                                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 text-white/5 pointer-events-none">
                                            <Navigation size={120} />
                                        </div>
                                        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={18} className="text-blue-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Target Coordinates Secured</p>
                                                </div>
                                                <p className="text-sm font-bold leading-relaxed">{selectedComplaint.location?.address}</p>
                                                {selectedComplaint.location?.landmark && (
                                                    <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-400/30">
                                                        <Zap size={14} className="text-yellow-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">LANDMARK: {selectedComplaint.location.landmark}</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-4 text-[11px] font-mono text-blue-200">
                                                    <span>LAT: {selectedComplaint.location?.lat?.toFixed(6)}</span>
                                                    <span>LNG: {selectedComplaint.location?.lng?.toFixed(6)}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={`https://www.google.com/maps?q=${selectedComplaint.location?.lat},${selectedComplaint.location?.lng}`}
                                                target="_blank" rel="noreferrer"
                                                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                            >
                                                <ExternalLink size={14} /> Navigate on Satellite
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        {selectedComplaint.status === 'Pending' || selectedComplaint.status === 'Reopened' ? (
                                            <button 
                                                onClick={() => { handleAccept(selectedComplaint._id); setModal(null); }}
                                                className="w-full bg-[#1D4ED8] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#1e40af] transition-all"
                                            >
                                                Authorise Operations on This Case
                                            </button>
                                        ) : selectedComplaint.status === 'In Progress' ? (
                                            <div className="flex gap-3">
                                                <button onClick={() => setModal('progress')} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Update Log</button>
                                                <button onClick={() => setModal('resolve')} className="flex-2 py-4 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100">Certify Resolution</button>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                                                <p className="text-green-700 font-black text-[10px] uppercase tracking-widest">Operation Successfully Concluded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modal === 'progress' && (
                                <>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
                                        <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                            <span>Current Deployment Level</span>
                                            <span className="text-govBlue">{progressInput.progress}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={progressInput.progress}
                                            onChange={(e) => setProgressInput({ ...progressInput, progress: Number(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-govBlue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Observation Note</label>
                                        <textarea
                                            rows="4"
                                            value={progressInput.note}
                                            onChange={(e) => setProgressInput({ ...progressInput, note: e.target.value })}
                                            placeholder="Document current field situation..."
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-govBlue outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            {(modal === 'resolve' || modal === 'directResolve') && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resolution Brief *</label>
                                        <textarea
                                            rows="3"
                                            value={modal === 'resolve' ? resolveInput.resolutionNote : directResolveInput.resolutionNote}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (modal === 'resolve') setResolveInput({ ...resolveInput, resolutionNote: val });
                                                else setDirectResolveInput({ ...directResolveInput, resolutionNote: val });
                                            }}
                                            placeholder="Explain how the issue was remediated..."
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-green-500 outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Field Proof (Certification Image)</label>
                                        <div className="relative group">
                                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, modal === 'resolve' ? 'resolve' : 'direct')} className="hidden" id="proof-upload" />
                                            <label htmlFor="proof-upload" className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 h-40 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all overflow-hidden bg-slate-50/50">
                                                {(modal === 'resolve' ? resolveInput.proofImage : directResolveInput.proofImage) ? (
                                                    <img src={modal === 'resolve' ? resolveInput.proofImage : directResolveInput.proofImage} alt="proof" className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Camera size={28} className="text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Image Asset</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setModal(null)} className="flex-1 py-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Dismiss</button>
                            <button onClick={modal === 'progress' ? handleUpdateProgress : (modal === 'resolve' ? handleResolve : handleDirectResolve)} 
                                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${modal.includes('resolve') ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-govBlue shadow-blue-100 hover:bg-blue-700'}`}>
                                Commit Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficerDashboard;
