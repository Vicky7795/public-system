import React, { useState } from 'react';
import {
    Edit2, Trash2, Clock, Activity, ArrowRight, Users, AlertTriangle,
    MoreVertical, UserPlus, BarChart2, EyeOff, FileDown, X,
    ChevronRight, CheckCircle2, AlertCircle, Loader2, Zap, ShieldCheck
} from 'lucide-react';
import api from '../../utils/api';

const DEPT_COLORS = ['#1D4ED8', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#9333EA', '#16A34A'];

/* ── tiny sub-components ── */
const StatPill = ({ label, value, highlight }) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">{label}</p>
        <p className={`text-sm font-black ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
    </div>
);

/* ════════════════════════════════════════════════════════ */
const DeptCard = ({ dep, colorIndex, onEdit, onDelete, allOfficers = [], onRefresh, addToast }) => {
    const color = DEPT_COLORS[colorIndex % DEPT_COLORS.length];
    const perf  = dep.slaPerformance ?? 100;
    const deptOfficers = allOfficers.filter(o => o.departmentId?._id === dep._id || o.departmentId === dep._id);
    const activeOfficers = deptOfficers.filter(o => o.status === 'Active');
    const isLowPerf = perf < 50;

    /* local UI state */
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const [showOfficers, setShowOfficers]   = useState(false);
    const [showAssign, setShowAssign]       = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [assignId, setAssignId]           = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    /* ── Analytics view ── */
    const resolved  = dep.resolved  ?? 0;
    const pending   = dep.pending   ?? 0;
    const total     = dep.totalComplaints ?? 0;

    /* ── Handlers ── */
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/departments/${dep._id}`);
            addToast?.(`${dep.departmentName} decommissioned`, 'success');
            onDelete?.();
            setShowConfirmDelete(false);
            onRefresh?.();
        } catch (err) {
            addToast?.(err.response?.data?.message || 'Delete failed.', 'error');
        } finally { setActionLoading(false); }
    };

    const handleAssign = async () => {
        if (!assignId) return;
        setActionLoading(true);
        try {
            await api.patch(`/auth/officers/${assignId}`, { departmentId: dep._id });
            addToast?.('Officer assigned successfully', 'success');
            setShowAssign(false);
            setAssignId('');
            onRefresh?.();
        } catch (err) {
            addToast?.(err.response?.data?.message || 'Assignment failed.', 'error');
        } finally { setActionLoading(false); }
    };

    const handleDisable = async () => {
        setShowQuickMenu(false);
        addToast?.('Department suspension feature coming soon.', 'info');
    };

    const handleExport = () => {
        setShowQuickMenu(false);
        const csv = [
            'Metric,Value',
            `Department,${dep.departmentName}`,
            `Total Complaints,${total}`,
            `Resolved,${resolved}`,
            `Pending,${pending}`,
            `Efficiency,${perf}%`,
            `SLA Hours,${dep.slaHours}h`,
            `Active Officers,${activeOfficers.length}`,
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${dep.departmentName}.csv`; a.click();
        URL.revokeObjectURL(url);
        addToast?.('Export downloaded', 'success');
    };

    /* ── ANALYTICS MODAL ── */
    if (showAnalytics) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
            <div className="p-6 flex-1 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Detailed Analytics</p>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">{dep.departmentName}</h3>
                    </div>
                    <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all">
                        <X size={16} />
                    </button>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-blue-700">{total}</p>
                        <p className="text-[8px] font-black text-blue-400 uppercase">Total</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-green-700">{resolved}</p>
                        <p className="text-[8px] font-black text-green-400 uppercase">Resolved</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-orange-700">{pending}</p>
                        <p className="text-[8px] font-black text-orange-400 uppercase">Pending</p>
                    </div>
                </div>

                {/* SLA performance bar */}
                <div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                        <span className="text-gray-400">SLA Efficiency</span>
                        <span style={{ color: perf >= 80 ? '#16A34A' : perf >= 50 ? '#EA580C' : '#DC2626' }}>{perf}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${perf}%`, backgroundColor: perf >= 80 ? '#16A34A' : perf >= 50 ? '#EA580C' : '#DC2626' }} />
                    </div>
                </div>

                {/* Officers in dept */}
                <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Officers ({deptOfficers.length})</p>
                    {deptOfficers.length === 0 ? (
                        <p className="text-[11px] text-gray-400 font-bold text-center py-3">No officers assigned</p>
                    ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {deptOfficers.map(o => (
                                <div key={o._id} className="flex items-center justify-between text-[11px] bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                    <span className="font-bold text-slate-700 truncate">{o.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${o.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {o.status || 'Active'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-1">
                    <button onClick={handleExport}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-700 transition-all">
                        <FileDown size={12} /> Export CSV
                    </button>
                    <button onClick={() => { setShowAnalytics(false); onEdit?.(); }}
                        className="flex-1 py-2.5 border-2 border-blue-100 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-all">
                        <Edit2 size={12} /> Edit Dept
                    </button>
                </div>
            </div>
        </div>
    );

    /* ── MAIN CARD ── */
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col relative">
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

            {/* Performance Alert Badge */}
            {isLowPerf && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg animate-pulse pointer-events-none">
                    <AlertTriangle size={10} /> Low Performance
                </div>
            )}

            <div className="p-6 flex-1">
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Activity size={20} />
                    </div>
                    <div className="flex gap-1 items-center relative">
                        <button onClick={onEdit} title="Edit Department"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" >
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => setShowConfirmDelete(true)} title="Delete Department"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} />
                        </button>
                        {/* Quick actions menu */}
                        <div className="relative">
                            <button onClick={() => setShowQuickMenu(p => !p)} title="More Actions"
                                className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-all">
                                <MoreVertical size={14} />
                            </button>
                            {showQuickMenu && (
                                <div className="absolute right-0 top-9 z-30 w-44 bg-white border border-gray-100 rounded-xl shadow-2xl py-1 animate-in zoom-in-95 duration-100">
                                    <button onClick={() => { setShowQuickMenu(false); setShowAnalytics(true); }}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-blue-50 flex items-center gap-2 transition-colors">
                                        <BarChart2 size={13} className="text-blue-500" /> Detailed Analytics
                                    </button>
                                    <button onClick={() => { setShowQuickMenu(false); setShowOfficers(p => !p); }}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-purple-50 flex items-center gap-2 transition-colors">
                                        <Users size={13} className="text-purple-500" /> View Officers
                                    </button>
                                    <button onClick={() => { setShowQuickMenu(false); setShowAssign(true); }}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-green-50 flex items-center gap-2 transition-colors">
                                        <UserPlus size={13} className="text-green-500" /> Assign Officer
                                    </button>
                                    <div className="border-t border-gray-50 my-1" />
                                    <button onClick={handleDisable}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-orange-500 hover:bg-orange-50 flex items-center gap-2 transition-colors">
                                        <EyeOff size={13} /> Disable Unit
                                    </button>
                                    <button onClick={handleExport}
                                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                        <FileDown size={13} /> Export Data
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-[#1D4ED8] transition-colors">
                    {dep.departmentName}
                </h3>
                <p className="text-[11px] text-gray-400 font-bold leading-relaxed line-clamp-2 mb-5">
                    {dep.description || 'No operational brief provided.'}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <StatPill label="Active Officers" value={`${activeOfficers.length} / ${deptOfficers.length}`} />
                    <StatPill label="Target SLA" value={
                        <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {dep.slaHours}h</span>
                    } />
                    <StatPill label="Total Cases" value={total} />
                    <StatPill label="Resolved" value={resolved} highlight />
                </div>

                {/* Efficiency bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">Unit Efficiency</span>
                        <span style={{ color: isLowPerf ? '#DC2626' : perf >= 80 ? '#16A34A' : '#EA580C' }}>{perf}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                            style={{
                                width: `${perf}%`,
                                backgroundColor: isLowPerf ? '#DC2626' : perf >= 80 ? '#16A34A' : color
                            }} />
                    </div>
                </div>

                {/* Officers mini-list (expandable) */}
                {showOfficers && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Officers in Unit</p>
                            <button onClick={() => setShowAssign(true)} className="text-[9px] font-black text-blue-600 hover:underline flex items-center gap-1">
                                <UserPlus size={10} /> Assign
                            </button>
                        </div>
                        {deptOfficers.length === 0 ? (
                            <p className="text-[11px] text-gray-400 font-bold text-center py-3 bg-gray-50 rounded-xl">No officers assigned</p>
                        ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {deptOfficers.map(o => (
                                    <div key={o._id} className="flex items-center justify-between text-[11px] bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-slate-700 text-white rounded-md flex items-center justify-center text-[8px] font-black shrink-0">
                                                {o.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-700 truncate">{o.name}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${o.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {o.status || 'Active'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Assign officer inline form */}
                {showAssign && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Assign Officer to This Unit</p>
                        <div className="flex gap-2">
                            <select value={assignId} onChange={e => setAssignId(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white">
                                <option value="">Select officer…</option>
                                {allOfficers.filter(o => o.departmentId?._id !== dep._id && o.departmentId !== dep._id).map(o => (
                                    <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                            </select>
                            <button onClick={handleAssign} disabled={!assignId || actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1">
                                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                Assign
                            </button>
                            <button onClick={() => { setShowAssign(false); setAssignId(''); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <button onClick={() => setShowAnalytics(true)}
                className="w-full py-4 bg-gray-50 border-t border-gray-100 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-[#1D4ED8] group-hover:text-white transition-all flex items-center justify-center gap-2">
                Detailed Analytics <ArrowRight size={12} />
            </button>

            {/* Delete Confirmation Overlay */}
            {showConfirmDelete && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-20 rounded-2xl animate-in fade-in duration-200">
                    <div className="p-4 bg-red-100 rounded-2xl mb-4">
                        <Trash2 size={28} className="text-red-600" />
                    </div>
                    <p className="font-black text-slate-900 text-base mb-1 text-center">Delete Department?</p>
                    <p className="text-[11px] text-gray-500 font-bold text-center mb-6">
                        <strong className="text-slate-700">{dep.departmentName}</strong> will be permanently removed from the system.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowConfirmDelete(false)}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleDelete} disabled={actionLoading}
                            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Decommission
                        </button>
                    </div>
                </div>
            )}

            {/* Click-away for quick menu */}
            {showQuickMenu && (
                <div className="fixed inset-0 z-20" onClick={() => setShowQuickMenu(false)} />
            )}
        </div>
    );
};

export default DeptCard;
