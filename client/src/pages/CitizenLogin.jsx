import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import { Mail, Lock, Loader2, User, ArrowRight, AlertCircle } from 'lucide-react';

const CitizenLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user && (data.user.role === 'Citizen' || data.user.role === 'Admin')) {
                navigate(data.user.role === 'Admin' ? '/admin' : '/dashboard');
            } else {
                setError('This account is registered as an Official. Please use the Officer Portal to login.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (error) {
            if (!error.response) {
                setError('Unable to connect to government server. Please check your internet connection or try again later.');
            } else {
                setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
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

            if (data.user && (data.user.role === 'Citizen' || data.user.role === 'Admin')) {
                navigate(data.user.role === 'Admin' ? '/admin' : '/dashboard');
            } else {
                setError('This account is registered as an Official. Please use the Officer Portal to login.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-6 mesh-gradient selection:bg-blue-100 selection:text-blue-900">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 text-govBlue font-black text-[10px] uppercase tracking-[0.2em] mb-6 border border-blue-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-govBlue animate-pulse"></span>
                        Secure Access Portal
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Citizen login</h1>
                    <p className="text-slate-500 font-medium">Access your personalized grievance dashboard</p>
                </div>

                <div className="glass-premium p-10 rounded-[3rem] border border-white/50 animate-fade-in-up animate-delay-100">
                    {error && (
                        <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100/50 flex items-center gap-3 animate-shake">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2 transition-colors group-focus-within:text-govBlue">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-govBlue" size={20} />
                                <input
                                    type="email" required
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                    placeholder="yourname@domain.gov"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2 transition-colors group-focus-within:text-govBlue">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-govBlue" size={20} />
                                <input
                                    type="password" required
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end mt-2 px-2">
                                <Link to="/citizen/forgot-password" size="sm" className="text-[10px] font-black text-slate-400 hover:text-govBlue uppercase tracking-widest transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-govBlue to-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-blue-400 hover:-translate-y-1 active:translate-y-0 transition-all flex justify-center items-center gap-3 hover-glow"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>Enter Dashboard</span>
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="bg-white px-4">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Authentication Failed')}
                                theme="filled_blue"
                                shape="pill"
                                text="signin_with"
                                width="400"
                            />
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            New to the platform?
                        </p>
                        <Link to="/citizen/register" className="text-govBlue font-black text-xs uppercase tracking-widest hover:underline hover:text-blue-700 transition-colors">
                            Create Citizen Account
                        </Link>
                    </div>
                </div>

                <div className="mt-10 text-center animate-fade-in-up animate-delay-200">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <span className="w-8 h-px bg-slate-200"></span>
                        Trusted Gov Cloud
                        <span className="w-8 h-px bg-slate-200"></span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CitizenLogin;
