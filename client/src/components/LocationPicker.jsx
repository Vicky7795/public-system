import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    Navigation, Loader2, Search, CheckCircle2, AlertCircle,
    MapPin, Wifi, Target, RefreshCw, Info, Map as MapIcon,
    Smartphone, MonitorSmartphone, ShieldAlert, Crosshair
} from 'lucide-react';
import api from '../utils/api';

/* ─── Fix Leaflet default icon in Vite ──────────────────────────────── */
const markerIcon = L.icon({
    iconUrl: '/leaflet/images/marker-icon.png',
    shadowUrl: '/leaflet/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = markerIcon;

/* ─── Constants ──────────────────────────────────────────────────────── */
const GEO_PROXY           = '/complaints';
const DEFAULT_CENTER      = [20.5937, 78.9629];   // India
const GOOD_ACCURACY       = 20;   // ≤20m = excellent for complaint filing
const ACCEPTABLE_ACCURACY = 50;   // ≤50m = usable, keep refining
const QUICK_TIMEOUT       = 5000; // ms – low-accuracy quick fix
const WATCH_TIMEOUT       = 13000;// ms – high-accuracy watch

/* ─── Helpers ────────────────────────────────────────────────────────── */
const isMobile = () => /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

const FlyToLocation = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => { if (center) map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 }); }, [center, zoom, map]);
    return null;
};

/* ─── Accuracy colour helpers ────────────────────────────────────────── */
const accColor = (acc) => {
    if (acc <= GOOD_ACCURACY)       return { ring: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'Excellent' };
    if (acc <= ACCEPTABLE_ACCURACY) return { ring: 'border-yellow-400',  badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',   label: 'Good' };
    return                                 { ring: 'border-orange-400',  badge: 'bg-orange-100 text-orange-700 border-orange-300',   label: 'Refining…' };
};

/* ─── Animated Accuracy Ring ─────────────────────────────────────────── */
const AccuracyRing = ({ accuracy }) => {
    const col = accColor(accuracy);
    // clamp stroke to 0–100 based on how close to excellent
    const pct = Math.max(0, Math.min(100, Math.round(100 - Math.min(accuracy, 200) / 2)));
    const r = 28, circ = 2 * Math.PI * r;
    return (
        <div className="relative flex items-center justify-center">
            <svg width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle cx="40" cy="40" r={r} fill="none"
                    stroke={accuracy <= GOOD_ACCURACY ? '#10b981' : accuracy <= ACCEPTABLE_ACCURACY ? '#eab308' : '#f97316'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (pct / 100) * circ}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black text-slate-700">{accuracy}m</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{col.label}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */
const LocationPicker = ({ onLocationSelect, initialLocation }) => {

    const [phase, setPhase]           = useState('idle');
    // idle | detecting | refining | map | confirmed | denied | fallback | error

    const [markerPos, setMarkerPos]   = useState(
        initialLocation?.lat ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
    );
    const [flyTo, setFlyTo]           = useState(null);
    const [accuracy, setAccuracy]     = useState(null);
    const [bestAccuracy, setBestAccuracy] = useState(Infinity);
    const [address, setAddress]       = useState(initialLocation?.address ?? '');
    const [structuredAddr, setStructuredAddr] = useState(initialLocation?.structured ?? null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [geocodeLoading, setGeocodeLoading] = useState(false);
    const [error, setError]           = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const [isIPBased, setIsIPBased]   = useState(false);
    const [statusMsg, setStatusMsg]   = useState('');

    const watchIdRef   = useRef(null);
    const geocodeTimer = useRef(null);
    const markerRef    = useRef(null);
    const searchTimer  = useRef(null);

    /* ── Stop watchPosition ── */
    const stopWatch = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    /* ── Cleanup ── */
    useEffect(() => {
        return () => {
            stopWatch();
            clearTimeout(geocodeTimer.current);
            clearTimeout(searchTimer.current);
        };
    }, [stopWatch]);

    /* ── Restore initial location ── */
    useEffect(() => {
        if (initialLocation?.lat) {
            setMarkerPos({ lat: initialLocation.lat, lng: initialLocation.lng });
            setFlyTo([initialLocation.lat, initialLocation.lng]);
            if (initialLocation.address) setAddress(initialLocation.address);
            setPhase('map');
        }
    }, [initialLocation]);

    /* ── Reverse geocode (debounced 600ms) ── */
    const geocode = useCallback((lat, lng) => {
        clearTimeout(geocodeTimer.current);
        geocodeTimer.current = setTimeout(async () => {
            setGeocodeLoading(true);
            try {
                const { data } = await api.get(`${GEO_PROXY}/reverse-geocode?lat=${lat}&lng=${lng}`);
                if (data?.address) {
                    // Ensure "India" is appended
                    const addr = data.address.includes('India') ? data.address : `${data.address}, India`;
                    setAddress(addr);
                    if (data.structured) setStructuredAddr(data.structured);
                }
            } catch { /* silent fail */ }
            finally  { setGeocodeLoading(false); }
        }, 600);
    }, []);

    /* ── IP Fallback ── */
    const startFallback = useCallback(async () => {
        setPhase('fallback');
        setIsIPBased(true);
        setError('');
        setStatusMsg('Searching via network…');
        try {
            const { data } = await api.get(`${GEO_PROXY}/ip-location`);
            const pos = { lat: data.lat, lng: data.lng };
            setMarkerPos(pos);
            setFlyTo([pos.lat, pos.lng]);
            setAccuracy(data.accuracy);
            const addr = [data.city, data.state, 'India'].filter(Boolean).join(', ');
            setAddress(addr);
            setStructuredAddr({ city: data.city || '', state: data.state || '', pincode: data.pincode || '', area: '' });
            setStatusMsg('Approximate location found. Drag pin to correct.');
            setPhase('map');
        } catch {
            setError('Could not detect location. Please search manually.');
            setPhase('error');
        }
    }, []);

    /* ── Main GPS Detection ── */
    const startDetection = useCallback(() => {
        setError('');
        setAccuracy(null);
        setBestAccuracy(Infinity);
        setIsIPBased(false);
        setStatusMsg('Requesting GPS signal…');
        setPhase('detecting');

        if (!navigator.geolocation) {
            setError('Geolocation not supported by your browser.');
            startFallback();
            return;
        }

        /* Phase 1 – Quick low-accuracy fix (shows something instantly) */
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude: lat, longitude: lng, accuracy: acc } }) => {
                setMarkerPos({ lat, lng });
                setFlyTo([lat, lng]);
                setAccuracy(Math.round(acc));
                setStatusMsg(`Initial fix: ${Math.round(acc)}m — improving…`);
                geocode(lat, lng);
            },
            null,
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 }
        );

        /* Phase 2 – High-accuracy continuous watch */
        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords: { latitude: lat, longitude: lng, accuracy: acc } }) => {
                const rounded = Math.round(acc);
                setAccuracy(rounded);

                if (rounded < bestAccuracy) {
                    setBestAccuracy(rounded);
                    setMarkerPos({ lat, lng });
                    setFlyTo([lat, lng]);
                    geocode(lat, lng);
                }

                if (rounded <= GOOD_ACCURACY) {
                    // Excellent – stop watching
                    stopWatch();
                    setStatusMsg(`Precision locked: ${rounded}m — ready to confirm!`);
                    setPhase('map');
                } else if (rounded <= ACCEPTABLE_ACCURACY) {
                    setStatusMsg(`Good signal: ${rounded}m — still improving…`);
                    setPhase('refining');
                } else {
                    setStatusMsg(`Weak signal: ${rounded}m — searching for better fix…`);
                    setPhase('detecting');
                }
            },
            (err) => {
                stopWatch();
                if (err.code === err.PERMISSION_DENIED) {
                    setPhase('denied');
                } else if (err.code === err.TIMEOUT && retryCount < 1) {
                    setRetryCount(p => p + 1);
                    setStatusMsg('Signal lost, retrying…');
                    setPhase('detecting');
                    setTimeout(startDetection, 800);
                } else {
                    setError('High-accuracy GPS failed. Falling back to network location.');
                    startFallback();
                }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: WATCH_TIMEOUT }
        );
    }, [bestAccuracy, geocode, retryCount, startFallback, stopWatch]);

    /* ── Confirm final location ── */
    const confirmLocation = useCallback(() => {
        stopWatch();
        if (!markerPos) return;
        const loc = {
            lat: markerPos.lat,
            lng: markerPos.lng,
            address,
            accuracy: accuracy ?? null,
            country: 'India',
            structured: structuredAddr,
            isApproximate: isIPBased || (accuracy !== null && accuracy > 100),
        };
        onLocationSelect(loc);
        setStatusMsg('');
        setPhase('confirmed');
    }, [markerPos, address, accuracy, structuredAddr, isIPBased, onLocationSelect, stopWatch]);

    const reDetect = useCallback(() => {
        stopWatch();
        setRetryCount(0);
        setIsIPBased(false);
        setPhase('idle');
        setTimeout(startDetection, 100);
    }, [stopWatch, startDetection]);

    /* ── Drag marker handler ── */
    const markerEventHandlers = useMemo(() => ({
        dragend() {
            const m = markerRef.current;
            if (!m) return;
            const { lat, lng } = m.getLatLng();
            setMarkerPos({ lat, lng });
            setIsIPBased(false);
            geocode(lat, lng);
        },
    }), [geocode]);

    /* ── Search handler ── */
    const handleSearchInput = (val) => {
        setSearchQuery(val);
        clearTimeout(searchTimer.current);
        setError('');

        if (!val || val.trim().length < 2) { setSearchResults([]); return; }

        const looksLikePincode = /^\d+$/.test(val.trim());
        if (looksLikePincode) {
            if (!/^[1-9][0-9]{5}$/.test(val.trim())) {
                if (val.trim().length >= 6) setError('Enter a valid 6-digit Indian pincode (e.g. 560001)');
                setSearchResults([]);
                return;
            }
        }

        searchTimer.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const { data } = await api.get(`${GEO_PROXY}/geocode-search?q=${encodeURIComponent(val.trim())}`);
                if (data?.length === 0) setError('No location found in India. Try a different name or pincode.');
                else setError('');
                setSearchResults(data || []);
            } catch (e) {
                setError(e.response?.data?.message || 'Search failed.');
                setSearchResults([]);
            } finally { setSearchLoading(false); }
        }, 450);
    };

    const selectResult = (r) => {
        const pos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
        setMarkerPos(pos);
        setFlyTo([pos.lat, pos.lng]);
        setSearchQuery('');
        setSearchResults([]);
        setIsIPBased(false);
        setError('');
        const a = r.address || {};
        const parts = [
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood || a.quarter || a.locality,
            a.city || a.town || a.village || a.county,
            a.state,
            a.postcode,
            'India'
        ].filter(Boolean);
        setAddress(parts.join(', ') || r.display_name);
        geocode(pos.lat, pos.lng);
        setPhase('map');
    };

    /* ══════════ RENDER ══════════ */

    /* ── IDLE: initial prompt ── */
    if (phase === 'idle') return (
        <div className="space-y-4">
            <SearchBox query={searchQuery} onQuery={handleSearchInput} results={searchResults} loading={searchLoading} onSelect={selectResult} />

            {error && <ErrorBanner msg={error} />}

            {!isMobile() && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <MonitorSmartphone size={20} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                        <span className="block text-blue-600 uppercase tracking-widest mb-0.5">Desktop Detected</span>
                        For the most precise location, use a <strong>mobile device with GPS enabled</strong>.
                        On desktop, location is estimated via network / IP which may be less accurate.
                    </p>
                </div>
            )}

            <button
                type="button" onClick={startDetection}
                className="w-full flex items-center justify-center gap-3 bg-[#1D4ED8] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#1e40af] transition-all shadow-md shadow-blue-200 group active:scale-[0.98]"
            >
                <Crosshair size={20} className="group-hover:animate-ping" />
                Detect My Precise Location
            </button>

            {isMobile() && (
                <p className="text-center text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                    <Smartphone size={13} /> Ensure GPS / Precise Location is ON in settings
                </p>
            )}

            <p className="text-center text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                — OR SEARCH / PIN MANUALLY BELOW —
            </p>
        </div>
    );

    /* ── PERMISSION DENIED ── */
    if (phase === 'denied') return (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center space-y-4">
            <ShieldAlert size={48} className="text-red-400 mx-auto" />
            <div>
                <p className="font-black text-slate-900 text-base">Location Access Denied</p>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Please allow location access in your browser settings, then try again.<br />
                    Or use the search box to find your location manually.
                </p>
            </div>
            <div className="space-y-2">
                <button type="button" onClick={() => setPhase('idle')}
                    className="w-full bg-[#1D4ED8] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1e40af] transition-all">
                    Search Manually
                </button>
                <button type="button" onClick={startDetection}
                    className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Retry GPS
                </button>
            </div>
        </div>
    );

    /* ── DETECTING / REFINING ── */
    if (phase === 'detecting' || phase === 'refining' || phase === 'fallback') return (
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-2xl p-8 text-center space-y-5">
            <div className="flex justify-center">
                {accuracy !== null ? (
                    <AccuracyRing accuracy={accuracy} />
                ) : (
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                        <MapIcon size={26} className="text-blue-600" />
                    </div>
                )}
            </div>

            <div>
                <p className="font-black text-slate-900 text-base">
                    {phase === 'refining' ? 'Improving Accuracy…' :
                     phase === 'fallback' ? 'Using Network Location…' :
                     'Detecting Your Location…'}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{statusMsg || 'Please wait, this usually takes a few seconds.'}</p>
            </div>

            {accuracy !== null && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black ${accColor(accuracy).badge}`}>
                    <Target size={14} />
                    {accuracy <= GOOD_ACCURACY ? `Precision: ${accuracy}m ✓` :
                     accuracy <= ACCEPTABLE_ACCURACY ? `Accuracy: ${accuracy}m – still refining` :
                     `Weak GPS: ${accuracy}m – searching…`}
                </div>
            )}

            {!isMobile() && (
                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold justify-center">
                    <MonitorSmartphone size={14} /> Use mobile device for best GPS accuracy
                </div>
            )}

            <button type="button" onClick={() => setPhase('idle')} className="text-xs text-slate-400 font-bold underline">Cancel</button>
        </div>
    );

    /* ── MAP + CONFIRMED ── */
    const isConfirmed = phase === 'confirmed';
    return (
        <div className="space-y-4 animate-in fade-in duration-500">

            {/* IP approximate warning */}
            {isIPBased && !isConfirmed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 items-start">
                    <Wifi size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-amber-800 uppercase tracking-tight">Approximate Location (IP Based)</p>
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">Drag the pin to your exact location for accurate complaint filing.</p>
                    </div>
                </div>
            )}

            {/* Accuracy live badge (map phase) */}
            {!isIPBased && accuracy !== null && !isConfirmed && (
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-[11px] font-black ${accColor(accuracy).badge}`}>
                    <div className="flex items-center gap-2">
                        <Target size={14} />
                        {accuracy <= GOOD_ACCURACY ? `GPS Precision: ${accuracy}m — Excellent ✓` :
                         accuracy <= ACCEPTABLE_ACCURACY ? `GPS Accuracy: ${accuracy}m — Good` :
                         `Accuracy: ${accuracy}m — Drag pin for manual fix`}
                    </div>
                    <button type="button" onClick={reDetect} title="Re-detect GPS" className="ml-2 opacity-70 hover:opacity-100">
                        <RefreshCw size={13} />
                    </button>
                </div>
            )}

            {statusMsg && !isConfirmed && (
                <p className="text-[10px] text-slate-500 font-bold text-center italic">{statusMsg}</p>
            )}

            {error && <ErrorBanner msg={error} />}

            {/* Search bar (only shown when not confirmed) */}
            {!isConfirmed && (
                <div className="flex gap-2">
                    <SearchBox query={searchQuery} onQuery={handleSearchInput} results={searchResults} loading={searchLoading} onSelect={selectResult} compact />
                    <button type="button" onClick={reDetect} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 rounded-xl font-bold text-xs transition-all border border-slate-200 shadow-sm" title="Re-detect GPS">
                        <RefreshCw size={14} />
                    </button>
                </div>
            )}

            {/* MAP */}
            <div className={`relative rounded-2xl overflow-hidden border-2 transition-colors duration-500 ${isConfirmed ? 'border-emerald-500 shadow-lg shadow-emerald-100' : 'border-slate-200'}`}>
                <MapContainer
                    center={markerPos ? [markerPos.lat, markerPos.lng] : DEFAULT_CENTER}
                    zoom={markerPos ? 17 : 5}
                    style={{ height: 360, width: '100%' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                    {flyTo && <FlyToLocation center={flyTo} zoom={isIPBased ? 14 : 17} />}
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            draggable={!isConfirmed}
                            eventHandlers={markerEventHandlers}
                            ref={markerRef}
                        />
                    )}
                </MapContainer>

                {/* Floating accuracy chip on map */}
                {!isIPBased && accuracy !== null && !isConfirmed && (
                    <div className={`absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg border shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur ${accColor(accuracy).badge}`}>
                        <Target size={11} /> {accuracy}m
                    </div>
                )}

                {/* Drag hint overlay */}
                {!isConfirmed && markerPos && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200 shadow-md flex items-center gap-1.5 pointer-events-none">
                        <MapPin size={11} className="text-blue-500" /> Drag pin to exact spot
                    </div>
                )}
            </div>

            {/* Address card */}
            {address && (
                <div className={`p-4 rounded-2xl border-2 flex gap-4 items-start transition-all ${isConfirmed ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`p-3 rounded-xl shrink-0 ${isConfirmed ? 'bg-emerald-600' : 'bg-[#1D4ED8]'} text-white shadow-md`}>
                        {geocodeLoading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isConfirmed ? 'text-emerald-600' : isIPBased ? 'text-amber-500' : 'text-slate-400'}`}>
                            {isConfirmed ? '✓ Confirmed Location' : isIPBased ? 'Approximate (Network)' : 'Detected Spot'}
                        </span>
                        <p className="text-slate-800 font-bold text-sm leading-snug mt-1">{address}</p>
                        {accuracy !== null && !isIPBased && (
                            <p className={`text-[10px] font-bold mt-1 ${accuracy <= GOOD_ACCURACY ? 'text-emerald-600' : 'text-orange-500'}`}>
                                GPS accuracy: ±{accuracy}m
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* FOOTER ACTIONS */}
            {!isConfirmed ? (
                <div className="space-y-3">
                    <button
                        type="button" onClick={confirmLocation} disabled={!markerPos}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        <CheckCircle2 size={18} />
                        Confirm Exact Location
                    </button>
                    <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase">
                        <Info size={12} /> Drag the pin if GPS is slightly off
                    </div>
                </div>
            ) : (
                <div className="bg-emerald-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-black shadow-xl shadow-emerald-100 animate-in zoom-in duration-300">
                    <CheckCircle2 size={20} />
                    Location Successfully Locked
                    <button type="button" onClick={() => { setPhase('idle'); onLocationSelect(null); }}
                        className="ml-4 text-[10px] underline uppercase tracking-widest opacity-80 hover:opacity-100">
                        Change
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── Shared sub-components ──────────────────────────────────────────── */

const ErrorBanner = ({ msg }) => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3 items-center">
        <AlertCircle size={16} className="text-red-500 shrink-0" />
        <p className="text-xs font-bold text-red-800">{msg}</p>
    </div>
);

const SearchBox = ({ query, onQuery, results, loading, onSelect, compact }) => (
    <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            {loading ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Search size={16} />}
        </div>
        <input
            type="text" value={query} onChange={(e) => onQuery(e.target.value)}
            placeholder="Search city, area or 6-digit pincode in India…"
            className={`w-full pl-11 pr-4 ${compact ? 'py-3' : 'py-3.5'} rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none text-sm font-medium transition-all bg-white`}
        />
        {results.length > 0 && (
            <div className="absolute z-[2000] w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {results.map((r) => {
                    const a = r.address || {};
                    const parts = [
                        a.suburb || a.neighbourhood || a.road,
                        a.city || a.town || a.village || a.county,
                        a.state,
                        'India'
                    ].filter(Boolean);
                    const label = parts.length > 1 ? parts.join(', ') : r.display_name;
                    return (
                        <button key={r.place_id} type="button" onClick={() => onSelect(r)}
                            className="w-full text-left px-5 py-3.5 text-sm hover:bg-blue-50 border-b border-slate-50 last:border-0 flex gap-3 items-start transition-colors">
                            <MapPin size={15} className="text-orange-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-slate-700 font-bold leading-tight block text-sm">{label}</span>
                                {a.postcode && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">PIN: {a.postcode}</span>}
                            </div>
                        </button>
                    );
                })}
            </div>
        )}
    </div>
);

export default LocationPicker;
