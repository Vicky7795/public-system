import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Users, AlertTriangle, CheckCircle2, AlertCircle,
    LayoutDashboard, Building2, BarChart3, PieChart as PieIcon,
    Bell, Settings, LogOut, Plus, Clock, ShieldCheck, Edit2, Trash2,
    Search, ChevronRight, TrendingUp, Activity, Loader2, X, Menu,
    FileText, UserCheck, Percent, LayoutGrid, ArrowRight
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
    BarChart, Bar
} from 'recharts';
import BackButton from '../components/BackButton';
import SummaryCard from '../components/SummaryCard';
import NotificationCenter from '../components/NotificationCenter';
import ComplaintsTable from '../components/admin/ComplaintsTable';
import DeptCard from '../components/admin/DeptCard';
import socket from '../utils/socket';

const DEPT_COLORS = ['#1D4ED8', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#9333EA', '#16A34A'];

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
    const [debouncedDeptSearch, setDebouncedDeptSearch] = useState('');
    const [officerSearch, setOfficerSearch] = useState('');
    const [debouncedOfficerSearch, setDebouncedOfficerSearch] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');
    const [saving, setSaving] = useState(false);

    // Officer Form State
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [editingOfficerId, setEditingOfficerId] = useState(null);
    const [officerForm, setOfficerForm] = useState({ name: '', email: '', phone: '', password: '', departmentId: '', assignedArea: '', designation: '', status: 'Active' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [commandModal, setCommandModal] = useState({ show: false, type: '', complaint: null });
    const [commandInput, setCommandInput] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [officerLoading, setOfficerLoading] = useState(false);
    const [officerError, setOfficerError] = useState('');

    const [selectedDept, setSelectedDept] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        } catch (err) {
            addToast(err.response?.data?.message || 'Data synchronization failure.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedDept]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { setMounted(true); }, []);

    // Socket.io for real-time updates
    useEffect(() => {
        socket.connect();

        socket.on('new_complaint', (newComplaint) => {
            setComplaints(prev => [newComplaint, ...prev]);
            // Update stats instantly
            setStats(prev => ({
                ...prev,
                total: prev.total + 1,
                pending: prev.pending + 1
            }));
            addToast(`New complaint filed: #${newComplaint.ticketId}`, 'info');
        });

        socket.on('status_update', (updatedComplaint) => {
            setComplaints(prev => {
                const old = prev.find(c => c._id === updatedComplaint._id);
                const newList = prev.map(c => c._id === updatedComplaint._id ? updatedComplaint : c);
                
                // If status changed to RESOLVED, update counters
                if (old && old.status !== 'RESOLVED' && updatedComplaint.status === 'RESOLVED') {
                    setStats(s => ({
                        ...s,
                        pending: Math.max(0, s.pending - 1),
                        resolved: s.resolved + 1
                    }));
                }
                return newList;
            });
            addToast(`Complaint #${updatedComplaint.ticketId} status updated to ${updatedComplaint.status}`, 'success');
        });

        return () => {
            socket.off('new_complaint');
            socket.off('status_update');
            socket.disconnect();
        };
    }, []);

    const fetchOfficerDetails = useCallback(async (officerId) => {
        if (!officerId) return;
        setOfficerLoading(true);
        setOfficerError('');
        try {
            const res = await api.get(`/auth/officers/${officerId}`);
            setSelectedOfficer(res.data);
        } catch {
            setOfficerError('Unable to load officer details. Please try again.');
        } finally {
            setOfficerLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer1 = setTimeout(() => setDebouncedDeptSearch(deptSearch), 300);
        const timer2 = setTimeout(() => setDebouncedOfficerSearch(officerSearch), 300);
        const timer3 = setTimeout(() => setDebouncedGlobalSearch(globalSearch), 300);
        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
    }, [deptSearch, officerSearch, globalSearch]);

    useEffect(() => {
        if (commandModal.show && commandModal.type === 'contact' && commandModal.complaint?.assignedOfficerId?._id) {
            fetchOfficerDetails(commandModal.complaint.assignedOfficerId._id);
        } else if (!commandModal.show) {
            setSelectedOfficer(null);
        }
    }, [commandModal.show, commandModal.type, commandModal.complaint?.assignedOfficerId?._id, fetchOfficerDetails]);

    const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
    const inProgressCount = complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'OVERDUE', 'ESCALATED'].includes(c.status)).length;
    const pendingCount = complaints.filter(c => ['NEW', 'NEEDS_REVIEW'].includes(c.status)).length;


    const statusPie = [
        { name: 'NEEDS TRIAGE', value: complaints.filter(c => c.status === 'NEEDS_REVIEW').length, color: '#D97706' },
        { name: 'NEW', value: complaints.filter(c => c.status === 'NEW').length, color: '#94A3B8' },
        { name: 'IN PROGRESS', value: inProgressCount, color: '#F97316' },
        { name: 'RESOLVED', value: resolvedCount, color: '#16A34A' },
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
        } catch { alert('Operation failed.'); }
        finally { setSaving(false); }
    };

    const deleteDept = async (id) => {
        try {
            await api.delete(`/departments/${id}`);
            addToast('Department decommissioned successfully');
            await fetchAll();
        } catch (err) {
            addToast(err.response?.data?.message || 'Decommission failed.', 'error');
        }
    };

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
            password: '',
            departmentId: o.departmentId?._id || '',
            assignedArea: o.assignedArea || '',
            designation: o.designation || '',
            status: o.status || 'Active'
        });
        setShowOfficerModal(true);
    };

    const saveOfficer = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingOfficerId) await api.patch(`/auth/officers/${editingOfficerId}`, officerForm);
            else await api.post('/auth/register', { ...officerForm, role: 'Officer' });
            setShowOfficerModal(false);
            await fetchAll();
        } catch (err) {
            addToast(err.response?.data?.message || 'Operation failed.', 'error');
        } finally {
            setSaving(false);
        }
    };
    
    const addToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const deleteOfficer = async (id) => {
        try {
            await api.delete(`/auth/officers/${id}`);
            setConfirmDeleteId(null);
            await fetchAll();
        } catch {
            alert('Operation failed.');
        }
    };

    const filteredOfficers = officers.filter(o => {
        const q = debouncedOfficerSearch.toLowerCase().trim();
        if (!q) return true;
        return o.name?.toLowerCase().includes(q) || 
               o.email?.toLowerCase().includes(q) ||
               o.departmentId?.departmentName?.toLowerCase().includes(q) ||
               o.assignedArea?.toLowerCase().includes(q);
    });

    const filteredDepts = departments.filter(d => {
        const q = debouncedDeptSearch.toLowerCase().trim();
        if (!q) return true;
        return d.departmentName?.toLowerCase().includes(q) ||
               d.description?.toLowerCase().includes(q);
    });

    const filteredComplaints = complaints.filter(c => {
        const q = debouncedGlobalSearch.toLowerCase().trim();
        if (!q) return true;
        return c.ticketId?.toLowerCase().includes(q) ||
               c.title?.toLowerCase().includes(q) ||
               c.category?.toLowerCase().includes(q) ||
               c.status?.toLowerCase().includes(q);
    });

    // Administrative Actions
    const handleAction = async (id, action, data = {}) => {
        setSaving(true);
        try {
            let res;
            if (action === 'reassign') res = await api.patch(`/complaints/${id}/reassign`, { officerId: data.officerId });
            else if (action === 'warn') res = await api.post(`/complaints/${id}/warn`, { message: data.message });
            else if (action === 'priority') res = await api.patch(`/complaints/${id}/priority`, { priorityLevel: data.priorityLevel });
            else if (action === 'remark') res = await api.post(`/complaints/${id}/remark`, { remark: data.remark });
            
            addToast(`Command Successful: ${action.toUpperCase()}`);
            setCommandModal({ show: false, type: '', complaint: null });
            setCommandInput('');
            await fetchAll();
            return res.data;
        } catch (err) {
            addToast(err.response?.data?.message || 'Command Failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center gap-4 bg-[#F9FAFB]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1D4ED8] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Initialising Secure Command Centre...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            {/* Sidebar Backdrop for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Unified Fixed Sidebar */}
            <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl lg:shadow-sm transition-transform duration-300 transform 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#1D4ED8] text-white p-2 rounded-lg shadow-md"><ShieldCheck size={20} /></div>
                            <span className="text-lg font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">PGRS ADMIN</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <nav className="space-y-1">
                        {[
                            { id: 'Overview', icon: <LayoutDashboard size={18} />, label: 'Dashboard Overview' },
                            { id: 'Complaints', icon: <AlertTriangle size={18} />, label: 'Master Registry' },
                            { id: 'Officers', icon: <Users size={18} />, label: 'Officer Management' },
                            { id: 'Departments', icon: <Building2 size={18} />, label: 'Departments' },
                            { id: 'Analytics', icon: <BarChart3 size={18} />, label: 'System Analytics' },
                            { id: 'Settings', icon: <Settings size={18} />, label: 'Portal Config' },
                        ].map(({ id, icon, label }) => (
                            <button key={id} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all
                                    ${activeTab === id ? 'bg-[#1D4ED8] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-[#111827]'}`}>
                                {icon} <span className="flex-1 text-left">{label}</span>
                                {id === 'Complaints' && pendingCount > 0 && activeTab !== id && (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{pendingCount}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="mt-auto p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-sm">A</div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-slate-900 truncate">CHIEF ADMINISTRATOR</div>
                            <div className="text-[9px] text-[#1D4ED8] font-black uppercase tracking-wider">Superuser Access</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all text-[10px] font-black uppercase tracking-[0.2em]">
                        <LogOut size={12} /> Log Out System
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-10 max-w-7xl transition-all duration-300">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex-1 lg:flex-none">
                            <div className="flex items-center gap-4 mb-2">
                                <BackButton fallbackPath="/" />
                                <div className="w-px h-6 bg-gray-200" />
                                <p className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-[0.3em]">Operational Control Terminal</p>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">{activeTab}</h1>
                        </div>
                    </div>
                    
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <NotificationCenter />
                            <div className="w-px h-6 bg-gray-200" />
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                <input 
                                    className="w-full pl-9 pr-8 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:border-[#1D4ED8] outline-none transition-all shadow-sm" 
                                    placeholder="Search complaints globally..." 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                                {globalSearch && (
                                    <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1D4ED8] rounded-lg border border-blue-100 shadow-sm">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Secured Backend</span>
                            </div>
                        </div>
                </header>

                {/* OVERVIEW CONTENT */}
                {activeTab === 'Overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <SummaryCard label="Global Grievances" value={complaints.length} color="blue" icon={<FileText size={24} />} />
                            <SummaryCard label="Operational Desk" value={resolvedCount} color="green" icon={<CheckCircle2 size={24} />} />
                            <SummaryCard label="Field Strength" value={officers.length} color="purple" icon={<UserCheck size={24} />} />
                            <SummaryCard label="Administrative Units" value={departments.length} color="amber" icon={<Building2 size={24} />} />
                        </div>

                        {/* Analytic Split */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <PieIcon size={14} className="text-[#1D4ED8]" /> Resolution Status Split
                                </h3>
                                <div className="h-[300px] min-w-0">
                                    {mounted && (
                                        <div className="h-full w-full">
                                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                                <PieChart>
                                                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                        {statusPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 space-y-3">{statusPie.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2 last:border-0">
                                        <span className="flex items-center gap-2 font-bold text-gray-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                                        <span className="font-black text-slate-900">{d.value}</span>
                                    </div>
                                ))}</div>
                            </div>

                            <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-[#1D4ED8]" /> Six-Month Intake Trend
                                </h3>
                                <div className="h-[300px] min-w-0">
                                    {mounted && (
                                        <div className="h-full w-full">
                                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                                <LineChart data={monthlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend verticalAlign="top" align="right" />
                                                    <Line type="monotone" dataKey="filed" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4, fill: '#1D4ED8', stroke: '#fff', strokeWidth: 2 }} name="Filed Service" />
                                                    <Line type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }} name="Resolved Action" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Recent Activity Stream</h3>
                                <button onClick={() => setActiveTab('Complaints')} className="text-[#1D4ED8] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">Manage Master Registry <ChevronRight size={14} /></button>
                            </div>
                            <ComplaintsTable complaints={filteredComplaints.slice(0, 8)} allOfficers={officers} onAction={handleAction} setCommandModal={setCommandModal} setCommandInput={setCommandInput} />
                        </div>
                    </div>
                )}

                {/* COMPLAINTS TAB */}
                {activeTab === 'Complaints' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex-1">Consolidated Service Registry</h3>
                            {[{ l: 'Total', v: complaints.length, c: 'blue' }, { l: 'Action Needed', v: pendingCount, c: 'red' }, { l: 'Successfully Closed', v: resolvedCount, c: 'green' }].map(s => (
                                <div key={s.l} className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase text-right">{s.l}</span>
                                    <span className={`text-sm font-black text-${s.c}-600`}>{s.v}</span>
                                </div>
                            ))}
                        </div>
                        <ComplaintsTable complaints={filteredComplaints} allOfficers={officers} onAction={handleAction} setCommandModal={setCommandModal} setCommandInput={setCommandInput} />
                    </div>
                )}

                {/* OFFICERS TAB */}
                {activeTab === 'Officers' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:max-w-md flex items-center">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-10 py-3.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm focus:border-[#1D4ED8] outline-none transition-all font-medium"
                                    placeholder="Search officers database..."
                                    value={officerSearch}
                                    onChange={e => setOfficerSearch(e.target.value)}
                                />
                                {officerSearch && (
                                    <button onClick={() => setOfficerSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <button onClick={openAddOfficer} className="w-full sm:w-auto bg-[#1D4ED8] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#1e40af] transition-all flex items-center justify-center gap-3">
                                <Plus size={18} /> Commission Officer
                            </button>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Duty Registry</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {filteredOfficers.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 font-bold text-sm">No officers found matching your search.</div>
                                ) : filteredOfficers.map(o => (
                                        <div key={o._id} className="px-8 py-5 flex items-center gap-6 hover:bg-gray-50/50 transition-all border-l-4 border-l-transparent hover:border-l-[#1D4ED8]">
                                            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm">{o.name?.charAt(0) || '?'}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{o.name}</p>
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-[#1D4ED8] rounded-md uppercase tracking-[0.15em] border border-blue-200">{o.departmentId?.departmentName || 'GENERAL SERVICE'}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                                    {o.email} • {o.phone || 'NO PHONE RECORDED'} • {o.assignedArea || 'GENERAL ZONE'}
                                                </p>
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Resolved</span>
                                                        <span className="text-xs font-black text-green-600">{o.resolvedCount || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-100 pl-4">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Overdue</span>
                                                        <span className="text-xs font-black text-red-600">{o.overdueCount || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-gray-100 pl-4">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Escalated</span>
                                                        <span className="text-xs font-black text-orange-600">{o.escalatedCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditOfficer(o)} className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-[#1D4ED8] hover:border-[#1D4ED8] rounded-xl transition-all shadow-sm"><Edit2 size={15} /></button>
                                                {confirmDeleteId === o._id ? (
                                                    <div className="flex items-center gap-1 bg-red-50 rounded-xl px-2 py-1 border border-red-100">
                                                        <span className="text-[9px] font-black text-red-500 uppercase px-2">CONFIRM?</span>
                                                        <button onClick={() => deleteOfficer(o._id)} className="text-[9px] font-black text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all shadow-sm">YES</button>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] font-black text-slate-500 px-2 py-1.5 hover:text-slate-700 transition-all uppercase">NO</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteId(o._id)} className="p-2.5 bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 rounded-xl border border-red-50 transition-all shadow-sm"><Trash2 size={15} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* DEPARTMENTS TAB */}
                {activeTab === 'Departments' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:max-w-md flex items-center">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-10 py-3.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm focus:border-[#1D4ED8] outline-none transition-all font-medium"
                                    placeholder="Search institutional units..."
                                    value={deptSearch}
                                    onChange={e => setDeptSearch(e.target.value)}
                                />
                                {deptSearch && (
                                    <button onClick={() => setDeptSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <button onClick={openAdd} className="w-full sm:w-auto bg-[#1D4ED8] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#1e40af] transition-all flex items-center justify-center gap-3">
                                <Plus size={18} /> Initialise Department
                            </button>
                        </div>

                        {filteredDepts.length === 0 ? (
                             <div className="py-12 text-center text-gray-400 font-bold text-sm bg-white rounded-xl border border-gray-200">No departments found matching your search.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredDepts.map((dep, i) => (
                                    <DeptCard
                                        key={dep._id}
                                        dep={dep}
                                        colorIndex={i}
                                        onEdit={() => openEdit(dep)}
                                        onDelete={() => deleteDept(dep._id)}
                                        allOfficers={officers}
                                        onRefresh={fetchAll}
                                        addToast={addToast}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'Analytics' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BarChart3 size={14} className="text-[#1D4ED8]" /> Operational Load per Unit
                                </h3>
                                <div className="h-64 min-w-0 overflow-hidden">
                                    {mounted && (
                                        <ResponsiveContainer width="100%" height={256} debounce={50}>
                                            <BarChart data={departments.map(d => ({ name: d.departmentName.split(' ')[0], total: d.totalComplaints || 0, resolved: d.resolved || 0 }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Legend />
                                                <Bar dataKey="total" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Orders Filed" />
                                                <Bar dataKey="resolved" fill="#16A34A" radius={[4, 4, 0, 0]} name="Orders Closed" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Percent size={14} className="text-emerald-500" /> Unit SLA Operational Efficiency
                                </h3>
                                <div className="space-y-6 max-h-64 overflow-y-auto pr-2">
                                    {departments.length === 0 ? <p className="text-slate-300 font-bold text-center py-6">EMPTY REGISTRY</p>
                                        : departments.map(dep => {
                                            const p = dep.slaPerformance ?? 100;
                                            const c = p >= 80 ? '#16A34A' : p >= 50 ? '#EA580C' : '#DC2626';
                                            return (<div key={dep._id} className="group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{dep.departmentName}</span>
                                                    <span className="text-[10px] font-black" style={{ color: c }}>{p}% Efficiency</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-50">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p}%`, backgroundColor: c }} />
                                                </div>
                                            </div>);
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* MODALS - Redesigned for Security/Admin Standards */}
            {(showModal || showOfficerModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                    onClick={e => e.target === e.currentTarget && (setShowModal(false), setShowOfficerModal(false))}>
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
                        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                                    {showModal ? (editingId ? 'Modify Institutional Unit' : 'Initialise New Unit') : (editingOfficerId ? 'Update Personnel Record' : 'Commission New Officer')}
                                </h2>
                                <p className="text-[10px] font-black text-[#1D4ED8] uppercase tracking-[0.2em] mt-1">Operational Protocol v2.4</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setShowOfficerModal(false); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
                        </header>

                        {showModal && (
                             <form onSubmit={saveDept} className="space-y-6">
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Name *</label>
                                 <input className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner"
                                     value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} required placeholder="e.g. INFRASTRUCTURE & WATER" />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Scope Brief</label>
                                 <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none min-h-[90px] resize-none shadow-inner"
                                     value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Briefly describe the unit's mandate…" />
                             </div>
                             <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                                 <div>
                                    <p className="text-[10px] font-black text-[#1D4ED8] uppercase tracking-widest mb-1">Service SLA Target</p>
                                    <p className="text-xs font-bold text-slate-500">Maximum resolution window in hours</p>
                                 </div>
                                 <input type="number" min="1" max="720"
                                     className="w-24 px-4 py-2 rounded-lg bg-white border border-blue-200 text-center font-black text-[#1D4ED8] outline-none shadow-sm focus:ring-2 ring-blue-50"
                                     value={deptForm.slaHours} onChange={e => setDeptForm({ ...deptForm, slaHours: parseInt(e.target.value) || 48 })} required />
                             </div>
                             <div className="flex gap-3 pt-6">
                                 <button type="button" onClick={() => setShowModal(false)}
                                     className="flex-1 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all text-gray-500">Abort</button>
                                 <button type="submit" disabled={saving}
                                     className="flex-1 bg-[#1D4ED8] text-white px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#1e40af] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                     {saving && <Loader2 size={16} className="animate-spin" />}
                                     {editingId ? 'Authorise Update' : 'Commit Creation'}
                                 </button>
                             </div>
                         </form>
                        )}

                        {showOfficerModal && (
                             <form onSubmit={saveOfficer} className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Identity Name *</label>
                                     <input className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner"
                                         value={officerForm.name} onChange={e => setOfficerForm({ ...officerForm, name: e.target.value })} required />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comms Channel *</label>
                                     <input placeholder="Phone number" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner text-sm"
                                         value={officerForm.phone} onChange={e => setOfficerForm({ ...officerForm, phone: e.target.value })} required />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Official Email @gov.in *</label>
                                 <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner"
                                     value={officerForm.email} onChange={e => setOfficerForm({ ...officerForm, email: e.target.value })} required />
                             </div>
                             {!editingOfficerId && (
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Security Key *</label>
                                     <input type="password" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner"
                                         value={officerForm.password} onChange={e => setOfficerForm({ ...officerForm, password: e.target.value })} />
                                 </div>
                             )}
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Departmental Mandate *</label>
                                     <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner appearance-none cursor-pointer"
                                         value={officerForm.departmentId} onChange={e => setOfficerForm({ ...officerForm, departmentId: e.target.value })} required>
                                         <option value="">-- SELECT ASSIGNMENT --</option>
                                         {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                     </select>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Designation</label>
                                         <input placeholder="e.g. Senior Inspector" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner text-sm"
                                             value={officerForm.designation} onChange={e => setOfficerForm({ ...officerForm, designation: e.target.value })} />
                                     </div>
                                     <div>
                                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duty Status</label>
                                         <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1D4ED8] transition-all font-bold text-slate-800 outline-none shadow-inner appearance-none cursor-pointer text-sm"
                                             value={officerForm.status} onChange={e => setOfficerForm({ ...officerForm, status: e.target.value })}>
                                             <option value="Active">Active</option>
                                             <option value="Inactive">Inactive</option>
                                         </select>
                                     </div>
                                 </div>
                             <div className="flex gap-3 pt-6">
                                 <button type="button" onClick={() => setShowOfficerModal(false)}
                                     className="flex-1 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all text-gray-500">Abort Registration</button>
                                 <button type="submit" disabled={saving}
                                     className="flex-1 bg-[#1D4ED8] text-white px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-[#1e40af] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                     {saving && <Loader2 size={16} className="animate-spin" />}
                                     {editingOfficerId ? 'Commit Update' : 'Initialise Personnel'}
                                 </button>
                             </div>
                         </form>
                        )}
                    </div>
                </div>
            )}

            {/* COMMAND MODAL - Unified Admin Intervention */}
            {commandModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <header className={`p-6 border-b border-gray-100 flex justify-between items-center ${commandModal.type === 'warn' ? 'bg-red-50/50' : commandModal.type === 'remark' ? 'bg-blue-50/50' : 'bg-green-50/50'}`}>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    {commandModal.type === 'warn' && <AlertTriangle size={20} className="text-red-500" />}
                                    {commandModal.type === 'remark' && <FileText size={20} className="text-blue-500" />}
                                    {commandModal.type === 'contact' && <Users size={20} className="text-green-500" />}
                                    {commandModal.type === 'warn' ? 'Issue Command Warning' : commandModal.type === 'remark' ? 'Administrative Remark' : 'Officer Performance Detail'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ticket ID: #{commandModal.complaint?.ticketId}</p>
                            </div>
                            <button onClick={() => setCommandModal({ show: false })} className="p-2 hover:bg-white rounded-lg transition-colors"><X size={18} /></button>
                        </header>

                        <div className="p-8 space-y-6">
                            {commandModal.type === 'contact' ? (
                                <div className="space-y-6 min-h-[300px] flex flex-col justify-center">
                                    {officerLoading ? (
                                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                                            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Personnel File...</p>
                                        </div>
                                    ) : officerError ? (
                                        <div className="text-center py-12">
                                            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-slate-900 mb-6">{officerError}</p>
                                            <button 
                                                onClick={() => fetchOfficerDetails(commandModal.complaint.assignedOfficerId._id)}
                                                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all"
                                            >
                                                Retry Access
                                            </button>
                                        </div>
                                    ) : selectedOfficer ? (
                                        <>
                                            <div className="flex items-center gap-4 bg-slate-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                                    <ShieldCheck size={60} />
                                                </div>
                                                <div className="w-14 h-14 rounded-lg bg-blue-600 flex items-center justify-center font-black text-2xl z-10">{selectedOfficer.name?.charAt(0)}</div>
                                                <div className="z-10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-lg font-bold">{selectedOfficer.name}</p>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${selectedOfficer.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                            {selectedOfficer.status || 'Active'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Activity size={10} /> {selectedOfficer.designation || 'Active Duty Officer'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Official Comms Channel</p>
                                                    <p className="font-bold text-slate-900 text-sm">{selectedOfficer.phone || 'No Phone Registered'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Departmental Identity</p>
                                                    <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{selectedOfficer.departmentId?.departmentName || 'General Services'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">NIC Email ID</p>
                                                    <p className="font-bold text-slate-900 text-sm truncate">{selectedOfficer.email || 'No Email Available'}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                {selectedOfficer.phone ? (
                                                    <a 
                                                        href={`tel:${selectedOfficer.phone}`}
                                                        className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]"
                                                    >
                                                        <Activity size={18} /> Establish Audio Link
                                                    </a>
                                                ) : (
                                                    <div className="w-full bg-slate-50 text-slate-300 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-100 cursor-not-allowed">
                                                        <X size={18} /> Call Protocol Disabled
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <AlertCircle size={40} className="text-slate-200 mx-auto mb-4" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initialising Portal Connection...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Professional Statement *</label>
                                        <textarea 
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all min-h-[140px] resize-none text-sm placeholder:text-gray-300"
                                            placeholder={commandModal.type === 'warn' ? "Identify breach of protocol or delay reason..." : "Enter official remark for internal tracking..."}
                                            value={commandInput}
                                            onChange={e => setCommandInput(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setCommandModal({ show: false })} className="flex-1 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-gray-200 text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                                        <button 
                                            onClick={() => handleAction(commandModal.complaint._id, commandModal.type, { [commandModal.type === 'warn' ? 'message' : 'remark']: commandInput })}
                                            disabled={!commandInput.trim() || saving}
                                            className={`flex-1 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${commandModal.type === 'warn' ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                            {commandModal.type === 'warn' ? 'Dispatch Warning' : 'Authorize Remark'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATIONS */}
            <div className="fixed top-8 right-8 z-[200] space-y-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right duration-300 font-bold text-xs uppercase tracking-wider ${t.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                        {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {t.msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
