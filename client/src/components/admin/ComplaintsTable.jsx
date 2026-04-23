import React from 'react';
import { Activity, AlertTriangle, AlertCircle, FileText, Users } from 'lucide-react';

const ComplaintsTable = ({ complaints, allOfficers, onAction, setCommandModal, setCommandInput }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'RESOLVED': return 'text-green-600 bg-green-50 border-green-100';
            case 'OVERDUE': return 'text-red-600 bg-red-50 border-red-100 animate-pulse';
            case 'ESCALATED': return 'text-white bg-red-600 border-red-700 font-black shadow-lg shadow-red-100';
            case 'IN_PROGRESS': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'ASSIGNED': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="px-8 py-4 whitespace-nowrap">Receipt ID</th>
                        <th className="px-6 py-4">Grievance Subject</th>
                        <th className="px-6 py-4">Status & SLA</th>
                        <th className="px-6 py-4">Assignment</th>
                        <th className="px-6 py-4 text-right">Command Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {complaints.length === 0 ? <tr><td colSpan={5} className="py-24 text-center text-gray-200 font-black uppercase tracking-widest text-[10px]">No operational records found</td></tr>
                        : complaints.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="px-8 py-5">
                                    <span className="font-mono text-xs font-black text-[#1D4ED8] bg-blue-50 border border-blue-100/50 px-2 py-1 rounded shadow-sm">#{c.ticketId}</span>
                                    {c.priorityLevel === 'High' && <div className="mt-1 text-[8px] font-black text-red-500 uppercase tracking-tighter flex items-center gap-1"><AlertTriangle size={10} /> High Priority</div>}
                                    {c.hasWarning && <div className="mt-1 text-[8px] font-black text-orange-500 uppercase tracking-tighter flex items-center gap-1 animate-pulse"><AlertCircle size={10} /> Sanctioned</div>}
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#1D4ED8] transition-colors">{c.title}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight line-clamp-1 mt-0.5">{c.category}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusStyles(c.status)}`}>
                                            <Activity size={10} /> {c.status}
                                        </div>
                                        {c.status !== 'RESOLVED' && (
                                            <span className="text-[8px] text-gray-400 font-bold italic">SLA: {new Date(c.slaDeadline).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <select 
                                        className="text-[10px] font-bold text-slate-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-blue-500 outline-none w-full max-w-[150px]"
                                        value={c.assignedOfficerId?._id || ''}
                                        onChange={(e) => onAction(c._id, 'reassign', { officerId: e.target.value })}
                                    >
                                        <option value="">Pool (Unassigned)</option>
                                        {allOfficers.filter(o => {
                                            const oDeptId = o.departmentId?._id || o.departmentId;
                                            const cDeptId = c.departmentId?._id || c.departmentId;
                                            return oDeptId === cDeptId || !cDeptId;
                                        }).map(o => (
                                            <option key={o._id} value={o._id}>{o.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => { setCommandInput(''); setCommandModal({ show: true, type: 'warn', complaint: c }); }}
                                            title={c.assignedOfficerId ? "Issue Command Warning" : "Cannot Warn: Assign Officer First"}
                                            disabled={!c.assignedOfficerId}
                                            className={`p-1.5 border rounded-lg transition-all shadow-sm ${!c.assignedOfficerId ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed' : c.hasWarning ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white border-gray-200 text-orange-400 hover:text-orange-600 hover:border-orange-500'}`}
                                        >
                                            <AlertCircle size={14} />
                                        </button>
                                        <button 
                                            onClick={() => { setCommandInput(''); setCommandModal({ show: true, type: 'remark', complaint: c }); }}
                                            title="Add Remark"
                                            className="p-1.5 bg-white border border-gray-200 text-blue-400 hover:text-blue-600 hover:border-blue-500 rounded-lg transition-all shadow-sm"
                                        >
                                            <FileText size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onAction(c._id, 'priority', { priorityLevel: c.priorityLevel === 'High' ? 'Medium' : 'High' })}
                                            title="Toggle High Priority"
                                            className={`p-1.5 bg-white border rounded-lg transition-all shadow-sm ${c.priorityLevel === 'High' ? 'text-red-500 border-red-500' : 'text-gray-300 border-gray-200 hover:text-red-400'}`}
                                        >
                                            <Activity size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setCommandModal({ show: true, type: 'contact', complaint: c })}
                                            title="Contact Officer"
                                            className="p-1.5 bg-white border border-gray-200 text-green-500 hover:bg-green-50 rounded-lg transition-all shadow-sm"
                                        >
                                            <Users size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default ComplaintsTable;
