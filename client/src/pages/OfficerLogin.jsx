import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Lock, Loader2, Shield } from 'lucide-react';

const OfficerLogin = () => {
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

            if (data.user.role === 'Officer') {
                navigate('/officer');
            } else if (data.user.role === 'Admin') {
                navigate('/admin');
            } else {
                setError('This account is registered as a Citizen. Please use the Citizen Portal to login.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (err) {
            if (!err.response) {
                setError('Secure Service Unavailable: Unable to connect to government server.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed: Invalid credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-100">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-md border border-slate-200">
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-lg">
                        <Shield size={40} />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Officer Portal</h2>
                <p className="text-slate-500 text-center mb-8 font-medium">Government of India Secure Login</p>

                {error && <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl mb-6 text-sm font-bold border border-orange-100 animate-pulse">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Officer Email Code</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email" required
                                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700"
                                placeholder="officer@nic.in"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Service Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="password" required
                                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-300 hover:bg-black hover:-translate-y-0.5 transition-all flex justify-center items-center mt-4">
                        {loading ? <Loader2 className="animate-spin text-white" /> : 'Authorize & Enter'}
                    </button>
                </form>
                <div className="mt-8 pt-8 border-t border-dashed border-slate-100">
                    <p className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Shield size={12} /> Restricted Official Access
                    </p>
                    <p className="mt-4 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
                        New Officer? <Link to="/officer/register" className="text-slate-900 hover:underline">Apply for Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OfficerLogin;
