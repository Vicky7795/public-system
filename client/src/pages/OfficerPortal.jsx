import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
    User, Phone, Mail, Lock, Loader2, Building2, 
    ShieldCheck, Eye, EyeOff, Shield
} from 'lucide-react';
import BackButton from '../components/BackButton';

const OfficerPortal = () => {
    // Top Level Tab State
    // Options: 'Officer Login', 'Officer Registration', 'Admin Login', 'Admin Registration'
    const [activeTab, setActiveTab] = useState('Officer Login');

    // Registration States
    const [regOfficerData, setRegOfficerData] = useState({ name: '', phone: '', email: '', departmentId: '' });
    const [officerSecret, setOfficerSecret] = useState('');
    const [regAdminData, setRegAdminData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    
    // Login States
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    
    // Shared UI States
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showAdminRegPassword, setShowAdminRegPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);

    const navigate = useNavigate();

    // Gov Colors
    const primaryBlue = "#0D47A1";
    const saffron = "#FF9933";
    const indiaGreen = "#138808";

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const { data } = await api.get('/departments');
                setDepartments(data);
            } catch {
                console.error('Failed to fetch departments');
            }
        };
        fetchDepartments();

        // Redirect if already logged in
        const token = localStorage.getItem('token');
        let currentRole = null;
        try { currentRole = JSON.parse(localStorage.getItem('user'))?.role; } catch {}
        
        if (token) {
            if (currentRole === 'Officer') navigate('/officer');
            else if (currentRole === 'Admin') navigate('/admin');
            else navigate('/dashboard');
        }
    }, [navigate]);

    // Handlers
    const handleOfficerSubmit = async (e) => {
        e.preventDefault();
        if (!regOfficerData.departmentId) return setError('Department is required');
        if (officerSecret !== 'officer123') return setError('Invalid Access Key');
        
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/register', { ...regOfficerData, role: 'Officer', password: 'officer123' });
            toast.success('Registration Successful');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => navigate('/officer'), 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Internal Server Error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminRegister = async (e) => {
        e.preventDefault();
        if (regAdminData.password !== regAdminData.confirmPassword) return setError('Passwords do not match');
        
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/register', { ...regAdminData, role: 'Admin' });
            toast.success('Admin Created');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => navigate('/admin'), 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/officer/login', loginData);
            
            // Check role mismatch for warning (optional)
            if (activeTab === 'Officer Login' && data.user.role === 'Admin') {
                toast.success('Logged in as Admin');
            } else if (activeTab === 'Admin Login' && data.user.role === 'Officer') {
                toast.success('Logged in as Officer');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'Officer') navigate('/officer');
            else if (data.user.role === 'Admin') navigate('/admin');
        } catch (err) {
            if (!err.response) {
                setError('Service Unavailable: Unable to connect to government server.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed: Invalid credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Render Forms
    const renderForm = () => {
        if (activeTab === 'Officer Registration') {
            return (
                <form onSubmit={handleOfficerSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type="text" required autoComplete="name"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 transition-all shadow-sm"
                                placeholder="Enter Official Name"
                                value={regOfficerData.name}
                                onChange={(e) => setRegOfficerData({ ...regOfficerData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Department</label>
                        <div className="relative">
                            <Building2 className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <select
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 appearance-none shadow-sm"
                                onChange={(e) => setRegOfficerData({ ...regOfficerData, departmentId: e.target.value })}
                                value={regOfficerData.departmentId}
                            >
                                <option value="" disabled>Select Department</option>
                                {departments.map(dep => <option key={dep._id} value={dep._id}>{dep.departmentName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Contact Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3 text-gray-400" size={16} />
                                <input
                                    type="tel" required autoComplete="tel"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                    placeholder="10-digit number"
                                    value={regOfficerData.phone}
                                    onChange={(e) => setRegOfficerData({ ...regOfficerData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Official Email ID</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                                <input
                                    type="email" required autoComplete="username"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                    placeholder="gov@nic.in"
                                    value={regOfficerData.email}
                                    onChange={(e) => setRegOfficerData({ ...regOfficerData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Secret Access Key</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type="password" required autoComplete="new-password"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                placeholder="Enter securely provided key"
                                value={officerSecret}
                                onChange={(e) => setOfficerSecret(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#0D47A1] text-white py-3 rounded text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md mt-6 uppercase">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'REGISTER FOR DUTY'}
                    </button>
                </form>
            );
        }

        if (activeTab === 'Admin Registration') {
            return (
                <form onSubmit={handleAdminRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type="text" required
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                placeholder="Full Name"
                                value={regAdminData.name}
                                onChange={(e) => setRegAdminData({ ...regAdminData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3 text-gray-400" size={16} />
                                <input
                                    type="tel" required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                    placeholder="10-digit"
                                    value={regAdminData.phone}
                                    onChange={(e) => setRegAdminData({ ...regAdminData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Email ID</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                                <input
                                    type="email" required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                    placeholder="admin@gov.in"
                                    value={regAdminData.email}
                                    onChange={(e) => setRegAdminData({ ...regAdminData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type={showAdminRegPassword ? "text" : "password"} required autoComplete="new-password"
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                placeholder="Create Secure Password"
                                value={regAdminData.password}
                                onChange={(e) => setRegAdminData({ ...regAdminData, password: e.target.value })}
                            />
                            <button type="button" onClick={() => setShowAdminRegPassword(!showAdminRegPassword)} className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600">
                                {showAdminRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type={showAdminRegPassword ? "text" : "password"} required autoComplete="new-password"
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-700 shadow-sm"
                                placeholder="Confirm Password"
                                value={regAdminData.confirmPassword}
                                onChange={(e) => setRegAdminData({ ...regAdminData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#0D47A1] text-white py-3 rounded text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md mt-6 uppercase">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'REGISTER FOR DUTY'}
                    </button>
                </form>
            );
        }

        // Default: Officer Login or Admin Login
        return (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Official Email ID</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                        <input
                            type="email" required autoComplete="username"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-900 transition-all shadow-inner"
                            placeholder="Enter Official Email"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                        <input
                            type={showLoginPassword ? "text" : "password"} required autoComplete="current-password"
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-900 transition-all shadow-inner"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600">
                            {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-gray-300 text-[#0D47A1] focus:ring-[#0D47A1]" />
                        <span className="text-xs font-semibold text-gray-600">Remember Me</span>
                    </label>
                    <Link to="/officer/forgot-password" className="text-xs font-bold text-[#0D47A1] hover:underline">Forgot Password?</Link>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-[#0D47A1] text-white py-3.5 rounded text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md mt-6 uppercase">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'LOGIN'}
                </button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">

            {/* Top Navigation / Back Button */}
            <div className="absolute top-4 left-4 z-20">
                <BackButton fallbackPath="/" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
                
                {/* Header Section (Above Card) */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Government of India Emblem" className="h-24 w-auto mx-auto mb-3 object-contain" />
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wide">Government of India</h1>
                    <div className="flex justify-center mt-2 mb-2">
                        {/* Tricolor Line */}
                        <div className="flex h-1 w-24 rounded overflow-hidden">
                            <div className="flex-1" style={{ backgroundColor: saffron }}></div>
                            <div className="flex-1 bg-white"></div>
                            <div className="flex-1" style={{ backgroundColor: indiaGreen }}></div>
                        </div>
                    </div>
                    <p className="text-[#0D47A1] font-bold tracking-widest uppercase text-sm sm:text-base">Duty Desk Entry Portal</p>
                </div>

                {/* Main Centered Card */}
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0_15px_40px_-15px_rgba(13,71,161,0.2)] border border-gray-100 overflow-hidden">
                    
                    {/* Segmented Control / Tabs */}
                    <div className="flex flex-wrap bg-gray-50 border-b border-gray-200">
                        {['Officer Login', 'Officer Registration', 'Admin Login', 'Admin Registration'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setError(''); }}
                                className={`flex-1 py-3 px-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors relative ${activeTab === tab ? 'text-[#0D47A1] bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D47A1]"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 sm:p-8">
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold flex items-center gap-2 rounded shadow-sm">
                                <ShieldCheck className="h-4 w-4 shrink-0" /> <span className="leading-tight">{error}</span>
                            </div>
                        )}

                        {renderForm()}
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <ShieldCheck size={16} className="text-green-600" /> Secure & Safe
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <Shield size={16} className="text-[#0D47A1]" /> Government Verified
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="pb-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest relative z-10">
                Official Government Portal © 2026
            </div>
        </div>
    );
};

export default OfficerPortal;
