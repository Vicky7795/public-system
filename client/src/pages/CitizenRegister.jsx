import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import { User, Phone, Mail, Lock, Loader2, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

const CitizenRegister = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', role: 'Citizen' });
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
                setError('Unable to connect to government server. Please check your internet connection or try again later.');
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
        <div className="flex items-center justify-center min-h-screen p-6 mesh-gradient selection:bg-green-100 selection:text-green-900">
            <div className="w-full max-w-xl">
                <div className="flex justify-between items-center mb-10 animate-fade-in-up">
                    <Link to="/citizen/login" className="group flex items-center gap-2 text-slate-700 hover:text-govBlue font-black text-[10px] uppercase tracking-widest transition-all">
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        Back to Login
                    </Link>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-900 font-black text-[10px] uppercase tracking-[0.25em] border border-green-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        Citizen Verified
                    </div>
                </div>

                <div className="text-center mb-10 animate-fade-in-up animate-delay-100">
                    <h1 className="text-6xl font-black text-slate-900 mb-3 tracking-tighter leading-none">Join PGRS</h1>
                    <p className="text-slate-600 font-bold tracking-tight">Create your official citizen account to file grievances</p>
                </div>

                <div className="glass-premium p-10 rounded-[3rem] border border-white/50 animate-fade-in-up animate-delay-200">
                    {error && (
                        <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100/50 flex items-center gap-3 animate-shake">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 px-2 transition-colors group-focus-within:text-govBlue">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-govBlue group-focus-within:scale-110" size={20} />
                                    <input
                                        type="text" required
                                        className="w-full pl-16 pr-6 py-6 rounded-3xl bg-white/60 border-2 border-slate-100 focus:border-govBlue focus:bg-white focus:shadow-[0_0_20px_rgba(30,64,175,0.1)] outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                        placeholder="Full Name"
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 px-2 transition-colors group-focus-within:text-govBlue">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-govBlue group-focus-within:scale-110" size={20} />
                                    <input
                                        type="tel" required
                                        className="w-full pl-16 pr-6 py-6 rounded-3xl bg-white/60 border-2 border-slate-100 focus:border-govBlue focus:bg-white focus:shadow-[0_0_20px_rgba(30,64,175,0.1)] outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                        placeholder="+91-0000000000"
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 px-2 transition-colors group-focus-within:text-govBlue">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-govBlue group-focus-within:scale-110" size={20} />
                                <input
                                    type="email" required
                                    className="w-full pl-16 pr-6 py-6 rounded-3xl bg-white/60 border-2 border-slate-100 focus:border-govBlue focus:bg-white focus:shadow-[0_0_20px_rgba(30,64,175,0.1)] outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                    placeholder="yourname@domain.nic.in"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 px-2 transition-colors group-focus-within:text-govBlue">Secret Password</label>
                            <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-govBlue group-focus-within:scale-110" size={20} />
                                <input
                                    type="password" required
                                    className="w-full pl-16 pr-6 py-6 rounded-3xl bg-white/60 border-2 border-slate-100 focus:border-govBlue focus:bg-white focus:shadow-[0_0_20px_rgba(30,64,175,0.1)] outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                                    placeholder="••••••••"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-br from-govBlue via-blue-700 to-indigo-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_-15px_rgba(30,64,175,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(30,64,175,0.6)] hover:-translate-y-1.5 active:translate-y-0 transition-all flex justify-center items-center gap-4 hover-glow group/btn overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] transition-transform"></div>
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span className="relative z-10">Register For Access</span>
                                        <ArrowRight size={20} className="relative z-10 transition-transform group-hover/btn:translate-x-2" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="bg-white px-4">Or sign up with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed')}
                            theme="filled_blue"
                            shape="pill"
                            text="signup_with"
                            width="100%"
                        />
                    </div>
                </div>

                <div className="mt-10 text-center animate-fade-in-up animate-delay-300">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-green-500" />
                        End-to-End Encrypted Data Pipeline
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CitizenRegister;
