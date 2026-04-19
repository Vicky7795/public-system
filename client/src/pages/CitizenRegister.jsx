import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import { User, Phone, Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

const CitizenRegister = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: 'Citizen' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/register', formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (err) {
            if (!err.response) {
                setError('Unable to connect to government server. Please check your internet connection.');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please check your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (response) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/google', { credential: response.credential });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
            {/* Left Side: Branding & Info (40%) */}
            <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#EEF2FF] via-white to-[#E0E7FF] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/60 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-50">
                            <img src="/logo.png" alt="Government Logo" className="h-10 w-10 object-contain" />
                        </div>
                        <h1 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Citizen Grievance Portal</h1>
                    </div>

                    <div className="space-y-6 mt-20">
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
                            Register to raise and track your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]">grievances</span> securely.
                        </h2>
                        <p className="text-lg font-medium text-gray-500 max-w-md leading-relaxed">
                            Join the unified government platform for seamless grievance redressal and transparent tracking.
                        </p>
                    </div>

                    <div className="mt-16 space-y-8">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-50 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Secure Profile</h4>
                                <p className="text-sm text-gray-400 font-semibold tracking-tight">Protected identity and data privacy.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Direct Engagement</h4>
                                <p className="text-sm text-gray-400 font-semibold tracking-tight">Direct communication with officials.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Fast Track Access</h4>
                                <p className="text-sm text-gray-400 font-semibold tracking-tight">Accelerated grievance submission process.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-blue-100/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]/60">© 2026 Ministry of Public Services • Digital India</p>
                </div>
            </div>

            {/* Right Side: Registration Card (60%) */}
            <div className="w-full lg:w-[60%] flex items-center justify-center p-6 lg:p-12 antialiased">
                <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Glassmorphism Registration Card */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-2xl p-8 lg:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]" />
                        
                        <div className="mb-10 text-center lg:text-left">
                            <h3 className="text-[28px] font-bold text-[#111827] mb-2 tracking-[-0.4px] leading-[1.2] font-['Plus_Jakarta_Sans',sans-serif]">Create Citizen Account</h3>
                            <p className="text-[14px] font-medium text-[#6B7280] leading-[1.5]">Register to access grievance services</p>
                        </div>

                        {error && (
                            <div className="bg-red-50/50 border border-red-100 text-[#DC2626] p-4 mb-8 rounded-xl flex items-center gap-3 text-[12px] font-normal animate-shake">
                                <ShieldCheck size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-[0.5px] px-1">Full Legal Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text" required
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-[0.5px] px-1">Contact Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        <input
                                            type="tel" required
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                                            placeholder="+91-0000000000"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-[0.5px] px-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email" required
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                                        placeholder="yourname@domain.gov"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-semibold text-[#374151] uppercase tracking-[0.5px] px-1">Secure Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2563EB] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'} required
                                        autoComplete="new-password"
                                        className="w-full pl-12 pr-12 py-4 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white py-4 rounded-xl font-semibold text-[14px] tracking-[0.3px] shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin text-[14px]" /> : (
                                        <>
                                            <span>Register Now</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-[12px] font-medium text-[#9CA3AF]">
                                    <span className="bg-white px-4 text-[12px]">Trusted Verification</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google Registration Failed')}
                                    theme="outline"
                                    shape="pill"
                                    text="signup_with"
                                    width="350"
                                />
                            </div>
                        </form>

                        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
                            <p className="text-[#9CA3AF] font-medium text-[12px] uppercase tracking-widest text-center">
                                Already have an account?
                            </p>
                            <Link to="/citizen/login" className="text-[#2563EB] font-semibold text-[13px] uppercase tracking-widest hover:text-[#1E3A8A] transition-colors hover:underline">
                                Sign In Instead
                            </Link>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-3 opacity-60">
                        <div className="flex items-center gap-2 text-[#1E3A8A] font-black text-[10px] uppercase tracking-[0.3em]">
                            <ShieldCheck size={16} /> Secure Government Portal
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-widest text-center">Your data is encrypted and protected under IT regulations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitizenRegister;

