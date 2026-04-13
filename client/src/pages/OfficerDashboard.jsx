import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Camera,
    MessageSquare,
    TrendingUp,
    Calendar,
    Users,
    Activity,
    ChevronRight,
    Search,
    FileText
} from 'lucide-react';

import BackButton from '../components/BackButton';

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
            const msg = err.response?.data?.message || err.message || 'Could not load data. Check connectivity.';
            setFetchError(msg);
            console.error('Officer fetchData error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [directResolveInput, setDirectResolveInput] = useState({ resolutionNote: '', proofImage: '' });

    const handleAccept = async (id) => {
        try {
            await api.patch(`/complaints/${id}/accept`);
            await fetchData();
            setView('mine');
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Failed to accept task');
        }
    };

    const handleUpdateProgress = async () => {
        try {
            await api.patch(`/complaints/${selectedId}/progress`, progressInput);
            setModal(null);
            fetchData();
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Failed to update progress');
        }
    };

    const handleResolve = async () => {
        if (!resolveInput.proofImage || !resolveInput.resolutionNote) {
            setFetchError('Resolution note and proof image are both required');
            return;
        }
        try {
            await api.patch(`/complaints/${selectedId}/resolve`, resolveInput);
            setModal(null);
            fetchData();
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Failed to resolve');
        }
    };

    const handleDirectResolve = async () => {
        if (!directResolveInput.resolutionNote) {
            setFetchError('Please provide a resolution note');
            return;
        }
        try {
            await api.patch(`/complaints/${selectedId}/accept-and-resolve`, directResolveInput);
            setModal(null);
            setDirectResolveInput({ resolutionNote: '', proofImage: '' });
            await fetchData();
        } catch (err) {
            setFetchError(err.response?.data?.message || 'Failed to resolve');
        }
    };

    const handleDirectFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setDirectResolveInput({ ...directResolveInput, proofImage: reader.result });
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setResolveInput({ ...resolveInput, proofImage: reader.result });
        reader.readAsDataURL(file);
    };

    const getTimeLeft = (deadline) => {
        if (!deadline) return { text: 'No Deadline', color: 'text-slate-400' };
        const diff = new Date(deadline) - new Date();
        if (diff < 0) return { text: 'Overdue', color: 'text-red-500' };
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return { text: `${hours}h remaining`, color: 'text-orange-500 font-black' };
        return { text: `${Math.floor(hours / 24)}d remaining`, color: 'text-slate-600 font-bold' };
    };

    if (loading) return (
        <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-govBlue/20 border-t-govBlue rounded-full animate-spin" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Authenticating Duty Desk...</p>
        </div>
    );

    const activeList = view === 'mine' ? complaints : pool;

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl animate-in fade-in duration-700">
            <BackButton />
            {fetchError && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span>Data sync error: {fetchError}</span>
                    <button onClick={fetchData} className="ml-auto text-xs underline hover:text-red-900">Retry</button>
                </div>
            )}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-1 w-8 bg-govBlue rounded-full"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Duty</p>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Officer Terminal</h1>
                    <p className="text-slate-500 font-bold text-sm italic">Logged in as: {user?.name}</p>
                </div>

                <div className="w-full md:w-auto bg-slate-100/50 p-1.5 rounded-[2rem] flex gap-1 border border-slate-200 backdrop-blur-sm self-center sm:self-auto">
                    <button
                        onClick={() => setView('mine')}
                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${view === 'mine' ? 'bg-white text-govBlue shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Stream ({stats.total})
                    </button>
                    <button
                        onClick={() => setView('pool')}
                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${view === 'pool' ? 'bg-white text-govBlue shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Intel Pool ({stats.poolCount})
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                <StatCard label="Assigned" value={stats.total} icon={<Calendar size={20} />} color="blue" />
                <StatCard label="Live Pool" value={stats.poolCount} icon={<Users size={20} />} color="purple" />
                <StatCard label="Active" value={stats.inProgress} icon={<TrendingUp size={20} />} color="orange" />
                <StatCard label="Closed" value={stats.resolved} icon={<CheckCircle2 size={20} />} color="green" />
            </div>

            <section>
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        {view === 'mine' ? <AlertCircle size={18} className="text-govBlue" /> : <TrendingUp size={18} className="text-govBlue" />}
                        {view === 'mine' ? 'Operational Tasks' : 'Unassigned Grievances'}
                    </h2>
                    {view === 'pool' && (
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">New Intake</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {activeList.length > 0 ? activeList.map(c => (
                        <div key={c._id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-govBlue/20 transition-all flex flex-col md:flex-row gap-8 overflow-hidden relative">
                            {/* Priority Indicator Stripe */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${c.priority === 'High' ? 'bg-red-500' : 'bg-orange-400'}`} />

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className="font-mono text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-500 border border-slate-200 uppercase tracking-widest">#{c.ticketId}</span>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2 ${c.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{c.priority} priority</span>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2 ${c.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{c.status}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight tracking-tight group-hover:text-govBlue transition-colors">{c.title}</h3>

                                <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed max-w-3xl">{c.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl text-govBlue"><MapPin size={16} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Deployment</p>
                                            <p className="text-xs font-bold text-slate-600 truncate" title={c.location?.address}>{c.location?.address || 'GPS Not Provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Clock size={16} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Status</p>
                                            <p className={`text-xs ${getTimeLeft(c.slaDeadline).color}`}>{getTimeLeft(c.slaDeadline).text}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-xl text-govBlue"><Users size={16} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Requester</p>
                                            <p className="text-xs font-bold text-slate-600 truncate">{c.userId?.name || 'Anonymous Citizen'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-3 md:min-w-[240px] bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 backdrop-blur-sm">
                                {(c.status === 'Pending' || c.status === 'Reopened') && view === 'mine' && (
                                    <button
                                        onClick={() => handleAccept(c._id)}
                                        className="w-full bg-govBlue text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-blue-400 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Start Working
                                    </button>
                                )}
                                {view === 'pool' && (
                                    <button
                                        onClick={() => handleAccept(c._id)}
                                        className="w-full bg-govBlue text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-blue-400 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Claim Assignment
                                    </button>
                                )}
                                {view === 'pool' && (
                                    <button
                                        onClick={() => { setSelectedId(c._id); setModal('directResolve'); setDirectResolveInput({ resolutionNote: '', proofImage: '' }); }}
                                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-200 hover:shadow-green-400 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        ✅ Resolve Directly
                                    </button>
                                )}
                                {(c.status === 'In Progress' || c.status === 'Assigned') && view === 'mine' && (
                                    <>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                <span>Work Progress</span>
                                                <span className="text-govBlue">{c.progress || 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                                                <div className="bg-govBlue h-full transition-all duration-1000 ease-out" style={{ width: `${c.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => { setSelectedId(c._id); setModal('progress'); setProgressInput({ progress: c.progress || 0, note: '' }) }}
                                                className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                            >
                                                Log Progress
                                            </button>
                                            <button
                                                onClick={() => { setSelectedId(c._id); setModal('resolve'); }}
                                                className="w-full bg-green-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:shadow-green-300 transition-all hover:-translate-y-0.5"
                                            >
                                                Final Closure
                                            </button>
                                        </div>
                                    </>
                                )}
                                {c.status === 'Resolved' && view === 'mine' && (
                                    <div className="text-green-600 font-extrabold flex flex-col items-center gap-3 justify-center py-6 bg-green-50/50 rounded-[2rem] border-2 border-green-100 border-dashed">
                                        <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle2 size={32} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Case Resolved</span>
                                    </div>
                                )}
                                <div className="mt-2 text-center">
                                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-dotted underline-offset-4 hover:text-govBlue transition-colors">Vew Full File</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <TrendingUp size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Clear Stream</h3>
                            <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">No tasks pending in this sector. Everything is under control.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Progress Modal */}
            {modal === 'progress' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 rounded-2xl text-govBlue"><Activity size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1">Field Update</h3>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Operation Log entry</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                                    <span>Deployment Level</span>
                                    <span className="text-govBlue">{progressInput.progress}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={progressInput.progress}
                                    onChange={(e) => setProgressInput({ ...progressInput, progress: Number(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-govBlue"
                                />
                                <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                    <span>Initialization</span>
                                    <span>Deployment</span>
                                    <span>Verification</span>
                                    <span>Finalization</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Ground Intelligence Note</label>
                                <textarea
                                    rows="4"
                                    value={progressInput.note}
                                    onChange={(e) => setProgressInput({ ...progressInput, note: e.target.value })}
                                    placeholder="Enter your field observations here..."
                                    className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none text-sm font-bold text-slate-800 shadow-inner transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Dismiss</button>
                            <button onClick={handleUpdateProgress} className="flex-1 bg-govBlue text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-200 hover:shadow-blue-400 transition-all hover:-translate-y-1">Commit Intel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {modal === 'resolve' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle2 size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-1 text-green-600">Final Redressal</h3>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Issue Closure Certification</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Resolution Brief</label>
                                <textarea
                                    required rows="3"
                                    value={resolveInput.resolutionNote}
                                    onChange={(e) => setResolveInput({ ...resolveInput, resolutionNote: e.target.value })}
                                    placeholder="Briefly explain the final resolution steps..."
                                    className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white outline-none text-sm font-bold text-slate-800 shadow-inner transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">Field Proof (Geo-tagged Image)</label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="proof-upload" />
                                    <label htmlFor="proof-upload" className="flex flex-col items-center justify-center gap-4 border-4 border-dashed border-slate-100 h-56 rounded-[3rem] cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden bg-slate-50/50 group">
                                        {resolveInput.proofImage ? (
                                            <div className="relative w-full h-full">
                                                <img src={resolveInput.proofImage} alt="proof" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">Click to Replace</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white rounded-3xl shadow-sm text-slate-300 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                                    <Camera size={32} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deploy Camera System</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Abort</button>
                            <button onClick={handleResolve} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-green-200 hover:shadow-green-400 transition-all hover:-translate-y-1">Authorize Closure</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Resolve Modal (from Intel Pool) */}
            {modal === 'directResolve' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle2 size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black text-green-700 tracking-tighter leading-none mb-1">Resolve from Pool</h3>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Department Direct Resolution</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Resolution Note *</label>
                                <textarea
                                    required rows="4"
                                    value={directResolveInput.resolutionNote}
                                    onChange={(e) => setDirectResolveInput({ ...directResolveInput, resolutionNote: e.target.value })}
                                    placeholder="Explain how this issue was resolved by your department..."
                                    className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-green-500 focus:bg-white outline-none text-sm font-bold text-slate-800 shadow-inner transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Proof Image (Optional)</label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleDirectFileChange} className="hidden" id="direct-proof-upload" />
                                    <label htmlFor="direct-proof-upload" className="flex flex-col items-center justify-center gap-3 border-4 border-dashed border-slate-100 h-36 rounded-[2rem] cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all bg-slate-50/50">
                                        {directResolveInput.proofImage ? (
                                            <img src={directResolveInput.proofImage} alt="proof" className="w-full h-full object-cover rounded-[2rem]" />
                                        ) : (
                                            <>
                                                <Camera size={24} className="text-slate-300" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Proof (optional)</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleDirectResolve} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-green-200 hover:shadow-green-400 transition-all hover:-translate-y-1">✅ Confirm Resolution</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100',
        green: 'text-green-600 bg-green-50 border-green-100',
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all ${colors[color].split(' ')[0]}`}>
                {React.cloneElement(icon, { size: 80 })}
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{label}</div>
                <div className={`text-4xl font-black tracking-tighter ${colors[color].split(' ')[0]}`}>{value}</div>
            </div>
        </div>
    );
};

export default OfficerDashboard;
