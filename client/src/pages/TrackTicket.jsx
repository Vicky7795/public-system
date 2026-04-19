import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Tag,
    Flag,
    Calendar,
    Download,
    Phone,
    MessageSquare,
    RefreshCcw,
    Star,
    Send,
    MapPin,
    ArrowLeft,
    X
} from 'lucide-react';
import api from '../utils/api';
import BackButton from '../components/BackButton';

const statusConfig = {
    'Pending': { 
        color: 'text-amber-600 bg-amber-50 border-amber-200', 
        icon: <Clock size={14} />, 
        step: 0,
    },
    'In Progress': { 
        color: 'text-blue-600 bg-blue-50 border-blue-200', 
        icon: <Loader2 size={14} className="animate-spin" />, 
        step: 1,
    },
    'Resolved': { 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200', 
        icon: <CheckCircle2 size={14} />, 
        step: 2,
    },
    'Reopened': { 
        color: 'text-rose-600 bg-rose-50 border-rose-200', 
        icon: <RefreshCcw size={14} />, 
        step: 0,
    },
};

const STEPS = ['Submitted', 'Processing', 'Resolved'];

const TrackTicket = () => {
    const location = useLocation();
    const [ticketId, setTicketId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackInput, setFeedbackInput] = useState({ rating: 5, feedback: '' });

    const trackTicket = useCallback(async (id) => {
        if (!id.trim()) return;
        setLoading(true);
        setError('');
        try {
            const clean = id.trim().replace(/^#/, '').toUpperCase();
            const { data } = await api.get(`/complaints/track/${clean}`);
            setResult(data);
            if (data.rating) setFeedbackInput({ rating: data.rating, feedback: data.feedback });
        } catch (error) {
            setError(error.response?.data?.message || 'Could not find a grievance with this ID.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const prefill = location.state?.prefill;
        if (prefill) {
            setTicketId(prefill);
            trackTicket(prefill);
        }
    }, [location.state, trackTicket]);

    const handleTrack = (e) => {
        e.preventDefault();
        trackTicket(ticketId);
    };

    const handleReopen = async () => {
        if (!window.confirm('Reopen this grievance for further review?')) return;
        try {
            const { data } = await api.patch(`/complaints/${result._id}/reopen`);
            setResult(data);
        } catch {
            alert('Action failed.');
        }
    };

    const handleFeedback = async () => {
        setSubmittingFeedback(true);
        try {
            const { data } = await api.patch(`/complaints/${result._id}/feedback`, feedbackInput);
            setResult(data);
        } catch {
            alert('Failed to submit feedback.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleWhatsApp = (wa) => {
        if (!wa) return;
        const url = `https://wa.me/${wa.replace(/[^0-9]/g, '')}`;
        window.open(url, '_blank');
    };

    const cfg = result ? (statusConfig[result.status] || statusConfig['Pending']) : null;
    const dept = result?.departmentId;

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center py-12 px-6">
            <div className="w-full max-w-2xl">
                <BackButton fallbackPath="/dashboard" className="mb-6" />
                
                {/* Search Section */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Track Your Grievance</h1>
                    <p className="text-slate-500 text-sm mb-6">Enter your complaint reference ID below</p>
                    
                    <form onSubmit={handleTrack} className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                                placeholder="Enter Complaint ID"
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold text-slate-700"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            {ticketId && (
                                <button type="button" onClick={() => setTicketId('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !ticketId.trim()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Track'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 flex gap-3 items-center mb-8">
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {result && (
                    <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Incident Reference</span>
                                <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight">#{result.ticketId}</h2>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 ${cfg.color}`}>
                                {cfg.icon}
                                {result.status}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-8">
                            
                            {/* Stepper Inside Card */}
                            <div className="relative px-4">
                                <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100" />
                                <div 
                                    className="absolute top-5 left-10 h-0.5 bg-blue-600 transition-all duration-700" 
                                    style={{ width: `${(cfg.step / 2) * 85}%` }}
                                />
                                <div className="flex justify-between relative z-10">
                                    {STEPS.map((step, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${cfg.step >= i ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-300'}`}>
                                                {cfg.step > i ? <CheckCircle2 size={18} /> : (i + 1)}
                                            </div>
                                            <span className={`text-[11px] mt-2 font-bold ${cfg.step >= i ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-4 pt-4">
                                <RowItem label="Category" value={result.category || 'General'} />
                                <RowItem label="Priority" value={result.priorityLevel || 'Medium'} />
                                <RowItem label="Filed On" value={new Date(result.createdAt).toLocaleDateString()} />
                                <RowItem label="SLA Deadline" value={new Date(result.slaDeadline).toLocaleDateString()} />
                                <RowItem label="Location" value={result.location?.address} isAddress />
                            </div>

                            {/* Department Contact Card (Exact Match to Design) */}
                            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[18px] p-6">
                                <div className="flex items-center gap-2 mb-4 text-[#94A3B8]">
                                    <Phone size={14} className="stroke-[3]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Department Contact</span>
                                </div>
                                {dept?.contactPhone ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-[#1E293B] text-[15px] leading-tight">{dept.contactOfficer || 'Nodal Officer'}</p>
                                            <p className="text-[12px] text-[#64748B] font-medium mt-0.5">{dept.departmentName}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a 
                                                href={`tel:${dept.contactPhone?.replace(/\s+/g, '')}`}
                                                onClick={(e) => {
                                                    if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                                                        e.preventDefault();
                                                        alert(`Support: ${dept.contactPhone}\n(Please use a mobile device to call directly)`);
                                                    }
                                                }}
                                                className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-[12px] font-bold text-[13px] hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-100"
                                            >
                                                <Phone size={14} className="stroke-[3]" /> Call Now
                                            </a>
                                            {dept.contactWhatsApp && (
                                                <button 
                                                    onClick={() => handleWhatsApp(dept.contactWhatsApp)}
                                                    className="flex items-center gap-2 bg-[#059669] text-white px-5 py-2.5 rounded-[12px] font-bold text-[13px] hover:bg-emerald-700 transition-all active:scale-95 shadow-sm shadow-emerald-100"
                                                >
                                                    <MessageSquare size={14} className="stroke-[3]" /> WhatsApp
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#94A3B8] font-medium italic">Contact details not available for this department yet.</p>
                                )}
                            </div>

                            {/* Description Box */}
                            <div className="space-y-3">
                                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Grievance Description</label>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                    <p className="text-slate-700 text-sm leading-relaxed">{result.description}</p>
                                </div>
                            </div>

                            {/* Resolution Proof (If any) */}
                            {result.status === 'Resolved' && result.proofImage && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <label className="text-[12px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-500" /> Resolution Proof
                                    </label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={result.proofImage} alt="proof" className="w-full h-auto max-h-64 object-cover" />
                                    </div>
                                    {result.resolutionNote && (
                                        <p className="text-xs text-slate-500 italic">" {result.resolutionNote} "</p>
                                    )}
                                </div>
                            )}

                            {/* Actions - Bottom of Card */}
                            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-3">
                                <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all">
                                    <Download size={18} /> Download Receipt
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all">
                                    <Phone size={18} /> Contact Department
                                </button>
                            </div>

                            {/* Feedback Section (Only for Citizen on their own resolved ticket) */}
                            {result.status === 'Resolved' && !result.rating && (
                                <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                                    <h4 className="font-bold text-slate-800 mb-4">Rate Resolution</h4>
                                    <div className="flex justify-center gap-2 mb-6">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} onClick={() => setFeedbackInput({ ...feedbackInput, rating: s })} className="hover:scale-110 transition-transform">
                                                <Star size={24} className={`fill-current ${s <= feedbackInput.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleFeedback}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm"
                                    >
                                        {submittingFeedback ? 'Submitting...' : 'Submit Satisfaction Rating'}
                                    </button>
                                    <button onClick={handleReopen} className="mt-4 text-[11px] text-red-500 font-bold uppercase tracking-widest hover:underline">
                                        Not satisfied? Click here to reopen
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const RowItem = ({ label, value, isAddress }) => (
    <div className={`flex ${isAddress ? 'flex-col gap-1' : 'justify-between items-center'} pb-3 border-b border-slate-50 last:border-0`}>
        <span className="text-[13px] font-medium text-slate-400">{label}</span>
        <span className={`text-[14px] font-bold text-slate-800 ${isAddress ? 'leading-snug' : ''}`}>{value || '—'}</span>
    </div>
);

export default TrackTicket;
