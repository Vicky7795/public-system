import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Phone, Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

import BackButton from '../components/BackButton';

const CitizenForgotPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: 'Passwords do not match!' });
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const { data } = await api.post('/auth/reset-password', {
                email: formData.email,
                phone: formData.phone,
                newPassword: formData.newPassword
            });
            setStatus({ type: 'success', message: data.message });
            setTimeout(() => navigate('/citizen/login'), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || 'Reset failed. Please verify your details.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-6 mesh-gradient">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10 animate-fade-in-up">
                    <BackButton fallbackPath="/citizen/login" className="mx-auto" />
                    <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Reset password</h1>
                    <p className="text-slate-500 font-medium">Verify your identity to secure your account</p>
                </div>

                <div className="glass-premium p-10 rounded-[3rem] border border-white/50 animate-fade-in-up animate-delay-100">
                    {status.message && (
                        <div className={`p-4 rounded-2xl mb-8 text-sm font-bold border flex items-center gap-3 animate-shake
                            ${status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Registered Email</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-govBlue" size={18} />
                                <input
                                    type="email" required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                    placeholder="Enter your email"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Registered Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-govBlue" size={18} />
                                <input
                                    type="tel" required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                    placeholder="Enter your phone number"
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">New Key</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-govBlue" size={18} />
                                    <input
                                        type="password" required
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Confirm Key</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-govBlue" size={18} />
                                    <input
                                        type="password" required
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 border-2 border-transparent focus:border-govBlue focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || status.type === 'success'}
                            className="w-full bg-govBlue text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-blue-400 hover:-translate-y-1 transition-all flex justify-center items-center gap-3 mt-4 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Update Security Key</span>
                                    <CheckCircle2 size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CitizenForgotPassword;
