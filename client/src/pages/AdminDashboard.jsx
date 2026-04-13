import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Users, AlertTriangle, CheckCircle2, AlertCircle,
    LayoutDashboard, Building2, BarChart3, PieChart as PieIcon,
    Bell, Settings, LogOut, Plus, Clock, Shield, Edit2, Trash2,
    Search, ChevronRight, TrendingUp, Activity, Loader2, X,
    FileText, UserCheck, Percent
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
    BarChart, Bar
} from 'recharts';
import BackButton from '../components/BackButton';

const DEPT_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#9333EA', '#16A34A'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deptForm, setDeptForm] = useState({ departmentName: '', description: '', slaHours: 48 });
    const [deptSearch, setDeptSearch] = useState('');
    const [officerSearch, setOfficerSearch] = useState('');
    const [saving, setSaving] = useState(false);

    // Officer Form State
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [editingOfficerId, setEditingOfficerId] = useState(null);
    const [officerForm, setOfficerForm] = useState({ name: '', email: '', phone: '', password: '', departmentId: '', assignedArea: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [selectedDept, setSelectedDept] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (!token || user?.role !== 'Admin') {
            navigate('/officer/login');
        }
    }, [navigate]);

    const fetchAll = useCallback(async () => {
        try {
            const [cRes, oRes, dRes] = await Promise.all([
                api.get('/complaints/all'),
                api.get('/auth/officers'),
                api.get('/departments'),
            ]);
            setComplaints(cRes.data);
            setOfficers(oRes.data);
            setDepartments(dRes.data);

            if (selectedDept) {
                const updated = dRes.data.find(d => d._id === selectedDept._id);
                if (updated) setSelectedDept(updated);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [selectedDept]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const pending = complaints.filter(c => c.status === 'Pending').length;

    const pieData = departments.map((d, i) => ({
        name: d.departmentName, value: d.totalComplaints || 0, color: DEPT_COLORS[i % DEPT_COLORS.length]
    })).filter(d => d.value > 0);

    const statusPie = [
        { name: 'Pending', value: pending, color: '#94A3B8' },
        { name: 'In Progress', value: inProgress, color: '#F97316' },
        { name: 'Resolved', value: resolved, color: '#22C55E' },
    ].filter(d => d.value > 0);

    const monthlyData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => ({
        name: m, filed: Math.floor(Math.random() * 60 + 20), resolved: Math.floor(Math.random() * 40 + 10)
    }));

    const openAdd = () => { setEditingId(null); setDeptForm({ departmentName: '', description: '', slaHours: 48 }); setShowModal(true); };
    const openEdit = (d) => { setEditingId(d._id); setDeptForm({ departmentName: d.departmentName, description: d.description || '', slaHours: d.slaHours }); setShowModal(true); };

    const saveDept = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingId) await api.patch(`/departments/${editingId}`, deptForm);
            else await api.post('/departments', deptForm);
            setShowModal(false); await fetchAll();
        } catch { alert('Failed. Dept name may already exist.'); }
        finally { setSaving(false); }
    };

    const deleteDept = async (id) => {
        if (!window.confirm('Delete this department?')) return;
        try { await api.delete(`/departments/${id}`); await fetchAll(); }
        catch { alert('Delete failed'); }
    };

    // Officer CRUD
    const openAddOfficer = () => {
        setEditingOfficerId(null);
        setOfficerForm({ name: '', email: '', phone: '', password: '', departmentId: '', assignedArea: '' });
        setShowOfficerModal(true);
    };

    const openEditOfficer = (o) => {
        setEditingOfficerId(o._id);
        setOfficerForm({
            name: o.name,
            email: o.email,
            phone: o.phone,
            password: '', // Don't show password
            departmentId: o.departmentId?._id || '',
            assignedArea: o.assignedArea || ''
        });
        setShowOfficerModal(true);
    };

    const saveOfficer = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingOfficerId) {
                await api.patch(`/auth/officers/${editingOfficerId}`, officerForm);
            } else {
                await api.post('/auth/register', { ...officerForm, role: 'Officer' });
            }
            setShowOfficerModal(false);
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save officer');
        } finally {
            setSaving(false);
        }
    };

    const deleteOfficer = async (id) => {
        try {
            await api.delete(`/auth/officers/${id}`);
            setConfirmDeleteId(null);
            await fetchAll();
        } catch (err) {
            console.error('Delete officer error:', err);
            alert(err.response?.data?.message || 'Delete failed. Check console for details.');
        }
    };

    const filteredOfficers = officers.filter(o =>
        o.name?.toLowerCase().includes(officerSearch.toLowerCase()) ||
        o.email?.toLowerCase().includes(officerSearch.toLowerCase())
    );

    const filteredDepts = departments.filter(d =>
        d.departmentName.toLowerCase().includes(deptSearch.toLowerCase())
    );

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-govBlue" size={40} /></div>;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20 shadow-sm">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-govBlue text-white p-2 rounded-xl shadow-lg shadow-blue-200"><Shield size={20} /></div>
                        <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">PGRS Admin</span>
                    </div>
                    <nav className="space-y-1">
                        {[
                            { id: 'Overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
                            { id: 'Complaints', icon: <AlertTriangle size={18} />, label: 'Complaints' },
                            { id: 'Officers', icon: <Users size={18} />, label: 'Officers' },
                            { id: 'Departments', icon: <Building2 size={18} />, label: 'Departments' },
                            { id: 'Analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
                            { id: 'Settings', icon: <Settings size={18} />, label: 'Settings' },
                        ].map(({ id, icon, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all
                                    ${activeTab === id ? 'bg-govBlue text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
                                {icon} <span className="flex-1 text-left">{label}</span>
                                {id === 'Complaints' && pending > 0 && activeTab !== id && (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pending}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-slate-50 space-y-2">
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 bg-govBlue text-white rounded-xl flex items-center justify-center font-black text-sm">A</div>
                        <div>
                            <div className="text-xs font-black text-slate-900">Chief Admin</div>
                            <div className="text-[10px] text-slate-400 font-bold">Superuser</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-all text-xs font-black uppercase tracking-widest">
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <BackButton fallbackPath="/" className="mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Admin Portal</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{activeTab}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input className="pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-sm focus:ring-2 ring-govBlue/20 w-52 outline-none font-medium" placeholder="Search…" />
                        </div>
                        <button className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-govBlue border border-slate-100 transition-all"><Bell size={17} /></button>
                        <button className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-govBlue border border-slate-100 transition-all"><Settings size={17} /></button>
                    </div>
                </header>

                {/* OVERVIEW */}
                {activeTab === 'Overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-5">
                            <StatCard label="Total Grievances" value={complaints.length} delta="+12%" icon={<FileText className="text-blue-500" />} accent="blue" />
                            <StatCard label="Resolved" value={resolved} delta="+5%" icon={<CheckCircle2 className="text-green-500" />} accent="green" />
                            <StatCard label="Active Officers" value={officers.length} delta="—" icon={<UserCheck className="text-purple-500" />} accent="purple" />
                            <StatCard label="Departments" value={departments.length} delta="—" icon={<Building2 className="text-amber-500" />} accent="amber" />
                        </div>
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-1 bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><PieIcon size={15} className="text-sky-500" />Status Split</h3>
                                <div className="h-48"><ResponsiveContainer width="100%" height="100%">
                                    <PieChart><Pie data={statusPie} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                        {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip /></PieChart>
                                </ResponsiveContainer></div>
                                <div className="mt-3 space-y-1.5">{statusPie.map((d, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="flex items-center gap-2 font-bold text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                                        <span className="font-black text-slate-800">{d.value}</span>
                                    </div>
                                ))}</div>
                            </div>
                            <div className="col-span-2 bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-indigo-500" />Monthly Trend</h3>
                                <div className="h-60"><ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                                        <Tooltip /><Legend />
                                        <Line type="monotone" dataKey="filed" stroke="#2563EB" strokeWidth={3} dot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} name="Filed" />
                                        <Line type="monotone" dataKey="resolved" stroke="#22C55E" strokeWidth={3} dot={{ r: 5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} name="Resolved" />
                                    </LineChart>
                                </ResponsiveContainer></div>
                            </div>
                        </div>
                        <RecentTable complaints={complaints.slice(0, 5)} onViewAll={() => setActiveTab('Complaints')} />
                    </div>
                )}

                {/* COMPLAINTS */}
                {activeTab === 'Complaints' && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b flex gap-3 items-center">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex-1">All Grievances</h3>
                            {[{ l: 'Total', v: complaints.length, c: 'blue' }, { l: 'Pending', v: pending, c: 'amber' }, { l: 'Resolved', v: resolved, c: 'green' }].map(s => (
                                <span key={s.l} className={`text-[10px] font-black px-3 py-1.5 rounded-full bg-${s.c}-50 text-${s.c}-600`}>{s.v} {s.l}</span>
                            ))}
                        </div>
                        <ComplaintsTable complaints={complaints} />
                    </div>
                )}

                {/* OFFICERS */}
                {activeTab === 'Officers' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-5">
                            <StatCard label="Total Officers" value={officers.length} delta="—" icon={<Users className="text-blue-500" />} accent="blue" />
                            <StatCard label="Avg Caseload" value={officers.length > 0 ? Math.round(complaints.length / officers.length) : 0} delta="—" icon={<Activity className="text-purple-500" />} accent="purple" />
                            <StatCard label="Departments" value={departments.length} delta="—" icon={<Building2 className="text-amber-500" />} accent="amber" />
                        </div>

                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:ring-4 ring-govBlue/10 outline-none font-medium transition-all"
                                    placeholder="Search officers by name or email…"
                                    value={officerSearch}
                                    onChange={e => setOfficerSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={openAddOfficer} className="bg-govBlue text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap">
                                <Plus size={18} /> Add Officer
                            </button>
                        </div>

                        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Officer Registry</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {filteredOfficers.length === 0 ? <div className="py-16 text-center text-slate-300 font-bold">No officers found.</div>
                                    : filteredOfficers.map(o => (
                                        <div key={o._id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-govBlue text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-100">{o.name?.charAt(0) || '?'}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 text-sm">{o.name}</p>
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-govBlue rounded-full uppercase tracking-wider">{o.departmentId?.departmentName || 'General'}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">{o.email} • {o.phone || 'No phone'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditOfficer(o)} className="p-2 bg-slate-50 hover:bg-white hover:shadow rounded-lg text-slate-400 hover:text-govBlue transition-all"><Edit2 size={14} /></button>
                                                {confirmDeleteId === o._id ? (
                                                    <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1 border border-red-100">
                                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Sure?</span>
                                                        <button onClick={() => deleteOfficer(o._id)} className="text-[9px] font-black text-white bg-red-500 px-2 py-1 rounded-md hover:bg-red-600 transition-all">Yes</button>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] font-black text-slate-500 px-1 py-1 hover:text-slate-700 transition-all">No</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteId(o._id)} className="p-2 bg-red-50/50 hover:bg-white hover:shadow rounded-lg text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* DEPARTMENTS */}
                {activeTab === 'Departments' && !selectedDept && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm focus:ring-4 ring-govBlue/10 outline-none font-medium transition-all"
                                    placeholder="Search departments by name or description…"
                                    value={deptSearch}
                                    onChange={e => setDeptSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={openAdd} className="bg-govBlue text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap">
                                <Plus size={18} /> Add Department
                            </button>
                        </div>

                        {filteredDepts.length === 0 ? (
                            <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                    <Building2 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">No departments found</h3>
                                <p className="text-slate-400 font-bold max-w-xs mx-auto mb-8 text-sm">Try adjusting your search or create a new department to get started.</p>
                                <button onClick={openAdd} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                                    Initialize First Department
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredDepts.map((dep, i) => (
                                    <DeptCard key={dep._id} dep={dep} colorIndex={i} onEdit={() => openEdit(dep)} onDelete={() => deleteDept(dep._id)} onViewDetails={() => setSelectedDept(dep)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Departments' && selectedDept && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <button onClick={() => setSelectedDept(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-govBlue transition-all mb-2">
                            <ChevronRight size={14} className="rotate-180" /> Back to Departments
                        </button>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(selectedDept)} className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-govBlue hover:bg-blue-50 transition-all shadow-sm"><Edit2 size={16} /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-govBlue shadow-inner">
                                    <Building2 size={36} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedDept.departmentName}</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Operational Analytics Unit</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><FileText size={12} className="text-blue-500" /> Total Cases</p>
                                    <p className="text-3xl font-black text-slate-900">{selectedDept.totalComplaints || 0}</p>
                                </div>
                                <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-2"><AlertCircle size={12} /> Pending</p>
                                    <p className="text-3xl font-black text-orange-600">{selectedDept.pending || 0}</p>
                                </div>
                                <div className="p-6 bg-green-50/50 rounded-3xl border border-green-100">
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2"><CheckCircle2 size={12} /> Resolved</p>
                                    <p className="text-3xl font-black text-green-600">{selectedDept.resolved || 0}</p>
                                </div>
                                <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Percent size={12} /> Efficiency</p>
                                    <p className="text-3xl font-black text-purple-600">{selectedDept.slaPerformance || 100}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b bg-slate-50/50 flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Departmental Stream</h3>
                            </div>
                            <ComplaintsTable complaints={complaints.filter(c => c.departmentId === selectedDept._id)} />
                        </div>
                    </div>
                )}

                {/* ANALYTICS */}
                {activeTab === 'Analytics' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500" />Cases per Department</h3>
                                <div className="h-60"><ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departments.map(d => ({ name: d.departmentName.split(' ')[0], total: d.totalComplaints || 0, resolved: d.resolved || 0 }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip /><Legend />
                                        <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} name="Total" />
                                        <Bar dataKey="resolved" fill="#22C55E" radius={[6, 6, 0, 0]} name="Resolved" />
                                    </BarChart>
                                </ResponsiveContainer></div>
                            </div>
                            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><PieIcon size={15} className="text-sky-500" />Department Share</h3>
                                {pieData.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-300 font-bold">No data yet</div> : (
                                    <div className="h-48"><ResponsiveContainer width="100%" height="100%">
                                        <PieChart><Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie><Tooltip /></PieChart>
                                    </ResponsiveContainer></div>
                                )}
                                <div className="mt-3 space-y-1.5">{pieData.slice(0, 4).map((d, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="flex items-center gap-2 font-bold text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                                        <span className="font-black text-slate-800">{d.value}</span>
                                    </div>
                                ))}</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><Percent size={15} className="text-emerald-500" />SLA Performance</h3>
                            <div className="space-y-3">
                                {departments.length === 0 ? <p className="text-slate-300 font-bold text-center py-6">No departments yet</p>
                                    : departments.map(dep => {
                                        const p = dep.slaPerformance ?? 100;
                                        const c = p >= 80 ? '#22C55E' : p >= 50 ? '#F97316' : '#EF4444';
                                        return (<div key={dep._id} className="flex items-center gap-4">
                                            <div className="w-36 truncate text-xs font-bold text-slate-700">{dep.departmentName}</div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: c }} />
                                            </div>
                                            <span className="text-xs font-black w-10 text-right" style={{ color: c }}>{p}%</span>
                                        </div>);
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Settings' && (
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter flex items-center gap-3">
                                <Settings className="text-govBlue" /> Portal Settings
                            </h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-sm font-bold text-slate-700">All Systems Operational</span>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Routing</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            Enabled (CNN-v2)
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <button className="w-full p-4 rounded-xl border-2 border-slate-100 text-left hover:bg-slate-50 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Database</p>
                                        <p className="text-sm font-bold text-slate-900">Run Manual Snapshot</p>
                                    </button>
                                    <button className="w-full p-4 rounded-xl border-2 border-red-50 text-left hover:bg-red-50 transition-all">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Danger Zone</p>
                                        <p className="text-sm font-bold text-red-600">Clear Audit Logs</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* DEPT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm"
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Edit Department' : 'New Department'}</h2>
                                <p className="text-xs text-slate-400 font-bold mt-1">Name must match AI prediction for routing</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={16} /></button>
                        </div>
                        <form onSubmit={saveDept} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department Name *</label>
                                <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} required placeholder="e.g. Water Supply" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none min-h-[72px] resize-none"
                                    value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Brief summary of duties…" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SLA Target (Hours) *</label>
                                <input type="number" min="1" max="720"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={deptForm.slaHours} onChange={e => setDeptForm({ ...deptForm, slaHours: parseInt(e.target.value) || 48 })} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all text-slate-500">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-govBlue text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:shadow-blue-300 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* OFFICER MODAL */}
            {showOfficerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm"
                    onClick={e => e.target === e.currentTarget && setShowOfficerModal(false)}>
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingOfficerId ? 'Edit Officer' : 'New Officer'}</h2>
                                <p className="text-xs text-slate-400 font-bold mt-1">Fill in details for departmental assignment</p>
                            </div>
                            <button onClick={() => setShowOfficerModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={16} /></button>
                        </div>
                        <form onSubmit={saveOfficer} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                                    <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                        value={officerForm.name} onChange={e => setOfficerForm({ ...officerForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number *</label>
                                    <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                        value={officerForm.phone} onChange={e => setOfficerForm({ ...officerForm, phone: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={officerForm.email} onChange={e => setOfficerForm({ ...officerForm, email: e.target.value })} required />
                            </div>
                            {!editingOfficerId && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Password *</label>
                                    <input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                        value={officerForm.password} onChange={e => setOfficerForm({ ...officerForm, password: e.target.value })} />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department Assignment *</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none appearance-none"
                                    value={officerForm.departmentId} onChange={e => setOfficerForm({ ...officerForm, departmentId: e.target.value })} required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Area</label>
                                <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={officerForm.assignedArea} onChange={e => setOfficerForm({ ...officerForm, assignedArea: e.target.value })} placeholder="e.g. Zone 4, District Area" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowOfficerModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all text-slate-500">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-govBlue text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:shadow-blue-300 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {editingOfficerId ? 'Update' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Sub-components ─────────────────────────── */

const StatCard = ({ label, value, delta, icon, accent }) => {
    const bg = { blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50', amber: 'bg-amber-50' };
    return (
        <div className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 ${bg[accent] || 'bg-slate-50'} rounded-xl`}>{icon}</div>
                {delta !== '—' && <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${String(delta).startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>{delta}</span>}
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</div>
        </div>
    );
};

const ComplaintsTable = ({ complaints }) => (
    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    {['Ticket', 'Category', 'Subject', 'Priority', 'Status', 'Officer'].map(h => <th key={h} className="px-5 py-4">{h}</th>)}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {complaints.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-slate-300 font-bold">No complaints.</td></tr>
                    : complaints.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50/80 transition-all">
                            <td className="px-5 py-4"><span className="font-mono text-xs font-black text-govBlue bg-blue-50 px-2 py-1 rounded-lg">#{c.ticketId}</span></td>
                            <td className="px-5 py-4"><span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{c.category}</span></td>
                            <td className="px-5 py-4"><div className="text-sm font-bold text-slate-800 truncate max-w-[160px]">{c.title}</div></td>
                            <td className="px-5 py-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${(c.priorityLevel || c.priority) === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {c.priorityLevel || c.priority || 'Medium'}
                                </span>
                            </td>
                            <td className="px-5 py-4">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full border
                                ${c.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-200' :
                                        c.status === 'In Progress' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                            c.status === 'Assigned' ? 'bg-blue-50 text-govBlue border-blue-200' :
                                                'bg-slate-50 text-slate-400 border-slate-200'}`}>{c.status}</span>
                            </td>
                            <td className="px-5 py-4">
                                {c.assignedOfficerId
                                    ? <div className="flex items-center gap-2"><div className="w-6 h-6 bg-govBlue text-white rounded-lg flex items-center justify-center text-[10px] font-black">{c.assignedOfficerId.name?.charAt(0) || '?'}</div><span className="text-xs font-bold text-slate-700">{c.assignedOfficerId.name}</span></div>
                                    : <span className="text-xs italic text-slate-300">Unassigned</span>}
                            </td>
                        </tr>
                    ))}
            </tbody>
        </table>
    </div>
);

const RecentTable = ({ complaints, onViewAll }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Stream</h3>
            <button onClick={onViewAll} className="text-govBlue text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">View All <ChevronRight size={12} /></button>
        </div>
        <ComplaintsTable complaints={complaints} />
    </div>
);

const DeptCard = ({ dep, colorIndex, onEdit, onDelete, onViewDetails }) => {
    const color = DEPT_COLORS[colorIndex % DEPT_COLORS.length];
    const perf = dep.slaPerformance ?? 100;
    const pc = perf >= 80 ? '#22C55E' : perf >= 50 ? '#F97316' : '#EF4444';

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-4 rounded-2xl shadow-inner cursor-pointer" style={{ backgroundColor: `${color}15` }} onClick={onViewDetails}>
                    <Building2 size={24} style={{ color }} />
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2.5 bg-slate-50 hover:bg-white hover:shadow-lg rounded-xl text-slate-400 hover:text-govBlue transition-all active:scale-90">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={onDelete} className="p-2.5 bg-red-50/50 hover:bg-white hover:shadow-lg rounded-xl text-slate-300 hover:text-red-500 transition-all active:scale-90">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex-1 cursor-pointer" onClick={onViewDetails}>
                <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight group-hover:text-govBlue transition-colors">{dep.departmentName}</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6 line-clamp-2 h-8 uppercase tracking-wider">{dep.description || 'Departmental Operational Unit'}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Activity size={10} className="text-govBlue" /> Total
                        </p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{dep.totalComplaints || 0}</p>
                    </div>
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-green-500" /> Solved
                        </p>
                        <p className="text-lg font-black text-green-600 tracking-tight">{dep.resolved || 0}</p>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-50 relative z-10">
                <div className="flex justify-between items-end mb-2.5">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> SLA Target
                        </p>
                        <p className="text-sm font-black text-slate-700">{dep.slaHours} Hours</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                        <p className="text-sm font-black" style={{ color: pc }}>{perf}%</p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${perf}%`, backgroundColor: pc }} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
