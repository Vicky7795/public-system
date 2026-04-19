import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Send, Image, MapPin, Loader2, CheckCircle2, X } from 'lucide-react';
import BackButton from '../components/BackButton';
import LocationPicker from '../components/LocationPicker';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const SubmitComplaint = () => {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({ title: '', description: '', landmark: '' });
    const [imageData, setImageData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/citizen/login', { replace: true });
    }, [navigate]);

    /* ── Image helpers ─────────────────────────────────────── */
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { 
            setError('Image must be smaller than 5 MB.'); 
            return; 
        }
        setError('');
        setImagePreview(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onloadend = () => setImageData(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageData(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLocationSelect = (loc) => {
        setLocation(loc);
        setError('');
    };

    /* ── Submit ────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!location) {
            setError('Please pinpoint your location on the map to file a grievance.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/complaints', {
                ...formData,
                imageData: imageData || null,
                language: i18n.language || 'en',
                location: {
                    ...location,
                    landmark: formData.landmark
                },
            });
            setSuccessData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Success screen ────────────────────────────────────── */
    if (successData) {
        return (
            <div className="max-w-xl mx-auto mt-12 p-10 bg-white rounded-2xl shadow-xl text-center border-t-8 border-green-500 animate-in zoom-in duration-500">
                <CheckCircle2 className="mx-auto text-green-500 mb-6" size={80} />
                <h2 className="text-3xl font-bold mb-4 text-slate-800">Grievance Submitted!</h2>
                <p className="text-slate-500 mb-8 font-medium">Your issue has been assigned to the relevant department based on its location and content.</p>
                
                <div className="bg-slate-50 p-6 rounded-xl mb-8 text-left space-y-3 border border-slate-200">
                    <p className="flex justify-between border-b pb-2">
                        <strong className="text-slate-500 uppercase text-[10px] tracking-widest">Ticket ID:</strong> 
                        <span className="font-bold text-slate-800">#{successData.ticketId}</span>
                    </p>
                    <p className="flex justify-between border-b pb-2">
                        <strong className="text-slate-500 uppercase text-[10px] tracking-widest">AI Category:</strong> 
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">{successData.category}</span>
                    </p>
                    <p className="flex justify-between border-b pb-2">
                        <strong className="text-slate-500 uppercase text-[10px] tracking-widest">Priority:</strong> 
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${successData.priorityLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {successData.priorityLevel || 'Medium'}
                        </span>
                    </p>
                    {successData.location?.address && (
                        <div className="pt-2">
                            <strong className="text-slate-500 uppercase text-[10px] tracking-widest block mb-1">📍 Registered Location:</strong>
                            <p className="text-slate-600 text-xs font-semibold leading-relaxed">{successData.location.address}</p>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => navigate('/dashboard')} className="bg-[#1D4ED8] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#1e40af] transition-all shadow-lg hover:shadow-blue-200">Go to Dashboard</button>
                    <Link to="/track" state={{ prefill: successData.ticketId }} className="border-2 border-slate-200 text-slate-600 px-8 py-3 rounded-lg font-bold hover:bg-slate-50 transition-all">Track Status</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
                <BackButton fallbackPath="/dashboard" />
                <LanguageSwitcher />
            </div>
            
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 border-b-4 border-govBlue w-fit pb-2 font-['Plus_Jakarta_Sans',sans-serif]">{t('submit.title')}</h1>
                <p className="text-slate-500 mt-2 font-medium">{t('submit.subtitle')}</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('submit.form_title')}</label>
                            <input
                                type="text" required
                                placeholder={t('submit.form_title_placeholder')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-govBlue focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800"
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('submit.form_description')}</label>
                            <textarea
                                required rows="6"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-govBlue focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800 leading-relaxed"
                                placeholder={t('submit.form_description_placeholder')}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-400 mt-2 font-bold italic">💡 Our AI will automatically route your grievance based on this description.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nearest Landmark (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Near Gandhi Park, Opp. Axis Bank"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-govBlue focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-slate-800"
                                value={formData.landmark}
                                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                            />
                            <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-wide">Helps the officer find the exact spot faster.</p>
                        </div>
                    </div>

                    {/* Right Column: Evidence */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visual Evidence</label>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                        {imagePreview ? (
                            <div className="relative w-full rounded-2xl overflow-hidden border-2 border-govBlue shadow-lg animate-in zoom-in duration-300">
                                <img src={imagePreview} alt="Preview" className="w-full h-[280px] object-cover" />
                                <button type="button" onClick={removeImage}
                                    className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-500 p-2 rounded-xl shadow-xl hover:bg-red-50 transition-all border border-red-100">
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-4 right-4 bg-govBlue/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest text-center py-2 rounded-lg shadow-xl">
                                    Image Captured Successfully
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="w-full h-[280px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-govBlue hover:text-govBlue hover:bg-blue-50/50 transition-all group">
                                <div className="p-5 bg-slate-50 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                    <Image size={48} className="text-slate-300 group-hover:text-govBlue transition-colors" />
                                </div>
                                <div className="text-center px-6">
                                    <span className="block font-bold text-slate-600 group-hover:text-govBlue">Click to upload photo</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Max size 5MB (JPG, PNG)</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Accuracy-Optimised Location Picker */}
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-govBlue" />
                            Specify Incident Spot <span className="text-red-500">*</span>
                        </div>
                        {location && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase animate-in fade-in slide-in-from-right-2">
                                <CheckCircle2 size={10} /> Precision Verified
                            </span>
                        )}
                    </label>
                    <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={location} />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in shake duration-300">
                        <Loader2 size={18} className="shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {/* Submit Action */}
                <button type="submit" disabled={loading}
                    className="w-full bg-[#1D4ED8] text-white py-4 rounded-xl font-black text-lg hover:bg-[#1e40af] flex justify-center items-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-blue-100 disabled:opacity-60 disabled:pointer-events-none group">
                    {loading ? (
                        <><Loader2 size={24} className="animate-spin" /> Finalising Submission...</>
                    ) : (
                        <><Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Submit Official Grievance</>
                    )}
                </button>
            </form>

            <footer className="mt-8 text-center bg-slate-50 py-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 • Government of India • Public Grievance Redressal System</p>
            </footer>
        </div>
    );
};

export default SubmitComplaint;
