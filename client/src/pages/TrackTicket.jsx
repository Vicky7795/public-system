import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    MapPin,
    Tag,
    Flag,
    User,
    Image as ImageIcon,
    Star,
    RefreshCcw,
    Send
} from 'lucide-react';
import api from '../utils/api';

const statusConfig = {
    'Pending': { color: 'bg-slate-100 text-slate-600 border-slate-300', icon: <Clock size={16} />, step: 1 },
    'In Progress': { color: 'bg-orange-100 text-orange-600 border-orange-300', icon: <AlertCircle size={16} />, step: 2 },
    'Resolved': { color: 'bg-green-100 text-green-600 border-green-300', icon: <CheckCircle2 size={16} />, step: 3 },
    'Reopened': { color: 'bg-red-100 text-red-600 border-red-300', icon: <RefreshCcw size={16} />, step: 1 },
};

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
        setResult(null);
        try {
            const clean = id.trim().replace(/^#/, '').toUpperCase();
            const { data } = await api.get(`/complaints/track/${clean}`);
            setResult(data);
            if (data.rating) setFeedbackInput({ rating: data.rating, feedback: data.feedback });
        } catch (error) {
            setError(error.response?.data?.message || 'Something went wrong. Please try again.');
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
        const tid = ticketId.trim();
        if (!tid) return;
        trackTicket(tid);
    };

    const [feedbackError, setFeedbackError] = useState('');

    const handleFeedback = async () => {
        setSubmittingFeedback(true);
        setFeedbackError('');
        try {
            const { data } = await api.patch(`/complaints/${result._id}/feedback`, feedbackInput);
            setResult(data);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setFeedbackError(msg);
            alert('Submission Failed: ' + msg);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleReopen = async () => {
        if (!window.confirm('Are you sure you want to reopen this complaint?')) return;
        try {
            const { data } = await api.patch(`/complaints/${result._id}/reopen`);
            setResult(data);
        } catch {
            alert('Failed to reopen complaint');
        }
    };

    const getTimeLeft = (deadline) => {
        const diff = new Date(deadline) - new Date();
        if (diff < 0) return { text: 'Overdue', color: 'text-red-500' };
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return { text: `${hours}h left`, color: 'text-orange-500 font-bold' };
        return { text: `${Math.floor(hours / 24)}d left`, color: 'text-slate-500' };
    };

    const cfg = result ? (statusConfig[result.status] || statusConfig['Pending']) : null;
    const currentStep = cfg?.step || 1;

    let currentUser = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) currentUser = JSON.parse(userStr);
    } catch {
        // Ignore parsing errors
    }

    return (
        <div className="max-w-2xl mx-auto p-6 mt-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 border-b-4 border-govBlue w-fit pb-2">
                Track Your Grievance
            </h2>
            <p className="text-slate-500 mb-8 text-sm">Real-time status tracking for your submitted complaints.</p>

            <form onSubmit={handleTrack} className="flex gap-3 mb-8">
                <input
                    type="text" value={ticketId}
                    onChange={(e) => setTicketId(e.target.value.trim().replace(/^#/, '').toUpperCase())}
                    placeholder="Enter 6-digit Ticket ID"
                    maxLength={24}
                    className="flex-1 px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-govBlue focus:ring-4 focus:ring-blue-50 outline-none font-mono text-lg tracking-widest uppercase transition-all"
                />
                <button type="submit" disabled={loading || !ticketId.trim()}
                    className="bg-govBlue text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-blue-100">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />} Track
                </button>
            </form>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0" /> {error}
                </div>
            )}

            {result && cfg && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                        {/* Header */}
                        <div className="bg-govBlue px-8 py-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Tracking</p>
                                <p className="text-3xl font-black font-mono tracking-widest">#{result.ticketId || result._id.slice(-6).toUpperCase()}</p>
                            </div>
                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase border-2 ${cfg.color} shadow-sm`}>
                                {cfg.icon} {result.status}
                            </span>
                        </div>

                        {/* Progress */}
                        <div className="px-8 py-6 border-b bg-slate-50/50">
                            <div className="flex items-center justify-between mb-8 overflow-hidden">
                                {['Submitted', 'In Progress', 'Resolved'].map((label, i) => {
                                    const stepNum = i + 1;
                                    const done = currentStep >= stepNum;
                                    const active = currentStep === stepNum;
                                    return (
                                        <div key={label} className="flex items-center flex-1 last:flex-none">
                                            <div className="flex flex-col items-center relative z-10">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-4 transition-all duration-500
                                                    ${done ? 'bg-govBlue border-white text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-300'}`}>
                                                    {done ? <CheckCircle2 size={20} /> : stepNum}
                                                </div>
                                                <span className={`text-[10px] mt-2 font-black uppercase tracking-wider ${active ? 'text-govBlue' : done ? 'text-slate-600' : 'text-slate-300'}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            {i < 2 && <div className={`flex-1 h-1.5 mx-[-2px] mb-5 transition-all duration-700 ${currentStep > stepNum ? 'bg-govBlue' : 'bg-slate-100'}`} />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Officer Assignment Info */}
                            {result.assignedOfficerId && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-govBlue shadow-inner">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Officer</p>
                                        <p className="font-bold text-slate-800">{result.assignedOfficerId?.name || 'Assigned Officer'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">SLA Status</p>
                                        <p className={`text-xs ${getTimeLeft(result.slaDeadline || new Date()).color}`}>{getTimeLeft(result.slaDeadline || new Date()).text}</p>
                                    </div>
                                </div>
                            )}

                            {result.status === 'In Progress' && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2 px-1">
                                        <span>Field Progress</span>
                                        <span>{result.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
                                        <div className="bg-govBlue h-full rounded-full transition-all duration-1000 shadow-lg shadow-blue-200" style={{ width: `${result.progress || 0}%` }}></div>
                                    </div>
                                    {result.notes?.length > 0 && (
                                        <div className="mt-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 italic text-xs text-blue-700">
                                            " {result.notes[result.notes.length - 1].note} "
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="px-8 py-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={<Tag className="text-blue-500" />} label="AI Category" value={result.category || 'General'} />
                                <DetailItem icon={<Flag className={result.priorityLevel === 'High' ? 'text-red-500' : 'text-orange-500'} />} label="Priority" value={`${result.priorityLevel || result.priority || 'Medium'} Level`} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Complaint Description</label>
                                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/50">{result.description}</p>
                            </div>

                            {result.location?.address && (
                                <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                                    <MapPin size={20} className="text-govBlue mt-1 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Location Detected</p>
                                        <p className="text-slate-600 text-xs leading-tight">{result.location.address}</p>
                                    </div>
                                </div>
                            )}

                            {/* Before Image */}
                            {result.imageData && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Attachment (Before)</label>
                                    <img src={result.imageData} alt="original" className="w-full h-48 object-cover rounded-2xl border-4 border-white shadow-md" />
                                </div>
                            )}

                            {/* Proof Image (Resolved State) */}
                            {result.status === 'Resolved' && result.proofImage && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200 flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <ImageIcon size={20} />
                                            <span className="font-bold text-sm">Resolution Proof Submitted</span>
                                        </div>
                                        <img src={result.proofImage} alt="proof" className="w-full h-56 object-cover rounded-xl border-2 border-white shadow-sm" />
                                        <p className="text-xs text-green-800 bg-white/50 p-3 rounded-lg border border-green-100"><strong>Note:</strong> {result.resolutionNote}</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center text-[10px] font-bold text-slate-400 pt-4 uppercase tracking-[0.3em]">
                                Filed On {new Date(result.createdAt).toDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Feedback Form */}
                    {result.status === 'Resolved' && String(currentUser?.id) === String(result?.userId) && (
                        <div className="bg-white rounded-[2rem] shadow-xl border p-8">
                            {result.rating ? (
                                <div className="text-center py-4 animate-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Feedback Received!</h3>
                                    <p className="text-sm text-slate-500 mb-4">Thank you for helping us improve.</p>
                                    <div className="flex justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16} className={s <= result.rating ? "text-yellow-400 fill-current" : "text-slate-100 fill-current"} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Rate our Service</h3>
                                            <p className="text-sm text-slate-500">Your feedback helps us improve governance.</p>
                                        </div>
                                        <button onClick={handleReopen} className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase border border-red-100 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-all">
                                            <RefreshCcw size={14} /> Reopen Case
                                        </button>
                                    </div>

                                    <div className="flex gap-2 mb-6">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} onClick={() => setFeedbackInput({ ...feedbackInput, rating: s })} className="transition-all hover:scale-110">
                                                <Star size={32} className={`fill-current ${s <= feedbackInput.rating ? 'text-yellow-400' : 'text-slate-100'}`} />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        rows="3" value={feedbackInput.feedback || ''}
                                        onChange={(e) => setFeedbackInput({ ...feedbackInput, feedback: e.target.value })}
                                        placeholder="Any comments on the resolution?"
                                        className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-govBlue outline-none text-sm mb-4"
                                    />

                                    {feedbackError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in slide-in-from-top-1">
                                            <AlertCircle size={14} /> {feedbackError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleFeedback}
                                        disabled={submittingFeedback}
                                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-200"
                                    >
                                        {submittingFeedback ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Submit Feedback</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="font-bold text-slate-800 text-xs">{value}</p>
        </div>
    </div>
);

export default TrackTicket;
