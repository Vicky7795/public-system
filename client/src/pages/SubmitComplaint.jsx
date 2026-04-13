import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Send, Image, MapPin, Loader2, CheckCircle2, X, Navigation, PenLine } from 'lucide-react';
import axios from 'axios';
import BackButton from '../components/BackButton';

const SubmitComplaint = () => {
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [imageData, setImageData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);
    const [locError, setLocError] = useState('');
    const [locMode, setLocMode] = useState('auto');   // 'auto' | 'manual'
    const [manualAddress, setManualAddress] = useState('');
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
        if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5 MB.'); return; }
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

    /* ── Geocoding relegated to Backend ──────────────────────── */


    /* ── GPS Geolocation with robust handling ─────────────────────── */
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocError('Geolocation is not supported by your browser. Please type your address.');
            setLocMode('manual');
            return;
        }
        setLocLoading(true);
        setLocError('');

        navigator.geolocation.getCurrentPosition(
            async ({ coords, timestamp }) => {
                try {
                    const { latitude: lat, longitude: lng, accuracy } = coords;
                    
                    // Client-side Reverse Geocoding using Nominatim
                    const geoRes = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                        { headers: { 'Accept-Language': 'en' } }
                    );

                    const a = geoRes.data.address || {};
                    const parts = [
                        a.road || a.pedestrian || a.footway,
                        a.suburb || a.neighbourhood || a.quarter,
                        a.city || a.town || a.village || a.county,
                        a.state,
                        a.postcode,
                        a.country
                    ].filter(Boolean);
                    
                    const address = parts.length > 0 ? parts.join(', ') : geoRes.data.display_name;

                    setLocation({
                        lat,
                        lng,
                        address,
                        accuracy: Math.round(accuracy),
                        timestamp: new Date(timestamp).toLocaleTimeString()
                    });
                    
                    // Automatically switch to manual to let user see/edit the resolved address
                    setManualAddress(address);
                } catch (err) {
                    console.error("Geocoding error:", err);
                    setLocError('Location detected but we could not resolve the address. Please enter it manually.');
                } finally {
                    setLocLoading(false);
                }
            },
            (err) => {
                const msgs = {
                    1: 'Permission Denied: Please allow location access in your browser settings.',
                    2: 'Position Unavailable: Unable to get a GPS lock. Try moving to an open area.',
                    3: 'Request Timed Out: GPS took too long. You can try again or enter manually.',
                };

                setLocError(msgs[err.code] || 'An unknown error occurred while detecting location.');
                setLocLoading(false);
                if (err.code === 1) setLocMode('manual');
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 15000 
            }
        );
    };

    /* ── Manual address ────────────────────────────────────── */
    const applyManualAddress = () => {
        const trimmed = manualAddress.trim();
        if (!trimmed) return;
        setLocation({ lat: null, lng: null, address: trimmed });
        setLocError('');
    };

    const removeLocation = () => {
        setLocation(null);
        setLocError('');
        setManualAddress('');
    };

    /* ── Submit ────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Sync location if in manual mode and address typed but not "Set"
            let finalLocation = location;
            if (locMode === 'manual' && manualAddress.trim() && (!location || location.address !== manualAddress.trim())) {
                finalLocation = { lat: null, lng: null, address: manualAddress.trim() };
            }

            const { data } = await api.post('/complaints', {
                ...formData,
                imageData: imageData || null,
                location: finalLocation || null,
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
            <div className="max-w-xl mx-auto mt-12 p-10 bg-white rounded-2xl shadow-xl text-center border-t-8 border-green-500">
                <CheckCircle2 className="mx-auto text-green-500 mb-6" size={80} />
                <h2 className="text-3xl font-bold mb-4">Grievance Submitted!</h2>
                <div className="bg-slate-50 p-6 rounded-xl mb-8 text-left space-y-3">
                    <p><strong>Ticket ID:</strong> #{successData.ticketId || successData._id.slice(-6).toUpperCase()}</p>
                    <p><strong>AI Category:</strong> <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{successData.category}</span></p>
                    {successData.departmentName && (
                        <p><strong>Department:</strong> <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">{successData.departmentName}</span></p>
                    )}
                    <p><strong>Priority:</strong> <span className={`px-3 py-1 rounded-full text-sm font-bold ${(successData.priorityLevel || successData.priority) === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{successData.priorityLevel || successData.priority || 'Medium'}</span></p>
                    {successData.location?.address && (
                        <p><strong>📍 Location:</strong> <span className="text-slate-600 text-sm">{successData.location.address}</span></p>
                    )}
                    {successData.imageData && (
                        <div>
                            <p className="font-semibold mb-2">📎 Attached Image:</p>
                            <img src={successData.imageData} alt="Complaint" className="rounded-lg max-h-48 w-full object-cover border" />
                        </div>
                    )}
                </div>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate('/dashboard')} className="bg-govBlue text-white px-6 py-3 rounded-lg font-bold">Go to Dashboard</button>
                    <Link to="/track" state={{ prefill: successData.ticketId || successData._id.slice(-6).toUpperCase() }} className="border-2 border-govBlue text-govBlue px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-all">Track this Ticket</Link>
                </div>
            </div>
        );
    }

    /* ── Form ──────────────────────────────────────────────── */
    return (
        <div className="max-w-2xl mx-auto p-6 mt-8">
            <BackButton fallbackPath="/dashboard" className="mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-8 border-b-4 border-govBlue w-fit pb-2">File a New Grievance</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-md border">

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Issue Title</label>
                    <input
                        type="text" required
                        placeholder="e.g., Street light damaged"
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Detailed Description <span className="text-slate-400 font-normal">(AI uses this for classification)</span>
                    </label>
                    <textarea
                        required rows="5"
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Provide full details about the issue, location, and since when it is persisting..."
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Attach Image <span className="text-slate-400 font-normal">(optional, max 5 MB)</span>
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                    {imagePreview ? (
                        <div className="relative w-full rounded-xl overflow-hidden border-2 border-govBlue">
                            <img src={imagePreview} alt="Preview" className="w-full max-h-56 object-cover" />
                            <button type="button" onClick={removeImage}
                                className="absolute top-2 right-2 bg-white text-red-500 border border-red-300 rounded-full p-1 shadow hover:bg-red-50 transition-all">
                                <X size={18} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-1 font-semibold">
                                Image attached ✓ — click ✕ to remove
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 py-6 rounded-xl text-slate-500 hover:border-govBlue hover:text-govBlue hover:bg-blue-50 transition-all">
                            <Image size={32} />
                            <span className="font-semibold">Click to add a photo</span>
                            <span className="text-xs text-slate-400">JPG, PNG, WEBP — max 5 MB</span>
                        </button>
                    )}
                    {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                </div>

                {/* Location */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700">
                            Location <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        {!location && (
                            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                <button type="button"
                                    onClick={() => { setLocMode('auto'); setLocError(''); }}
                                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-md font-bold transition-all ${locMode === 'auto' ? 'bg-white text-govBlue shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Navigation size={12} /> Auto-Detect
                                </button>
                                <button type="button"
                                    onClick={() => { setLocMode('manual'); setLocError(''); }}
                                    className={`flex items-center gap-1 text-xs px-3 py-1 rounded-md font-bold transition-all ${locMode === 'manual' ? 'bg-white text-govBlue shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <PenLine size={12} /> Type Address
                                </button>
                            </div>
                        )}
                    </div>

                    {location ? (
                        <div className="flex items-start gap-4 bg-blue-50/50 border-2 border-govBlue/30 rounded-2xl p-5 shadow-sm">
                            <div className="bg-govBlue text-white p-2.5 rounded-xl shadow-lg">
                                <MapPin size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-govBlue font-black text-[10px] uppercase tracking-widest mb-1">Detected GPS Coordinates</p>
                                <p className="text-slate-800 font-bold text-sm leading-snug break-words mb-2">{location.address}</p>
                                <div className="flex flex-wrap gap-2">
                                    {location.lat && (
                                        <span className="text-[9px] font-mono font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 uppercase">
                                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                        </span>
                                    )}
                                    {location.accuracy && (
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${location.accuracy < 50 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            Accuracy: {location.accuracy}m
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button type="button" onClick={removeLocation} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                    ) : locMode === 'auto' ? (
                        <button type="button" onClick={detectLocation} disabled={locLoading}
                            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 py-3 rounded-xl text-slate-500 hover:border-govBlue hover:text-govBlue hover:bg-blue-50 transition-all disabled:opacity-60">
                            {locLoading
                                ? <><Loader2 size={20} className="animate-spin" /> Detecting your location...</>
                                : <><Navigation size={20} /> Detect My Location</>
                            }
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyManualAddress())}
                                placeholder="e.g., MG Road, Bengaluru, Karnataka"
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-govBlue focus:ring-2 focus:ring-blue-50 outline-none text-sm"
                            />
                            <button type="button" onClick={applyManualAddress} disabled={!manualAddress.trim()}
                                className="bg-govBlue text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-md transition-all disabled:opacity-50">
                                Set
                            </button>
                        </div>
                    )}

                    {locError && (
                        <p className="text-amber-600 text-sm mt-2 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            ⚠️ {locError}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                    className="w-full bg-govBlue text-white py-3 rounded-lg font-extrabold text-lg hover:shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-60">
                    {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Submit Grievance</>}
                </button>
            </form>
        </div>
    );
};

export default SubmitComplaint;
