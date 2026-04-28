import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

const OfficerResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const saffron = '#FF9933';
    const indiaGreen = '#138808';

    // Password strength check
    const getStrength = (pwd) => {
        if (!pwd) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        const levels = [
            { level: 0, label: '', color: '' },
            { level: 1, label: 'Weak', color: 'bg-red-500' },
            { level: 2, label: 'Fair', color: 'bg-amber-400' },
            { level: 3, label: 'Good', color: 'bg-blue-500' },
            { level: 4, label: 'Strong', color: 'bg-green-500' },
        ];
        return levels[score];
    };

    const strength = getStrength(form.newPassword);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (form.newPassword.length < 6) {
            return setError('Password must be at least 6 characters.');
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/officer/login'), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Government of India Emblem" className="h-20 w-auto mx-auto mb-3 object-contain" />
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wide">Government of India</h1>
                    <div className="flex justify-center mt-2 mb-2">
                        <div className="flex h-1 w-24 rounded overflow-hidden">
                            <div className="flex-1" style={{ backgroundColor: saffron }}></div>
                            <div className="flex-1 bg-white border-t border-b border-gray-200"></div>
                            <div className="flex-1" style={{ backgroundColor: indiaGreen }}></div>
                        </div>
                    </div>
                    <p className="text-[#0D47A1] font-bold tracking-widest uppercase text-sm">Duty Desk Entry Portal</p>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_15px_40px_-15px_rgba(13,71,161,0.2)] border border-gray-100 overflow-hidden">

                    <div className="bg-[#0D47A1] px-6 py-4">
                        <h2 className="text-white font-bold text-lg">Set New Password</h2>
                        <p className="text-blue-200 text-xs mt-0.5">Officer &amp; Admin Account Reset</p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {!success ? (
                            <>
                                {/* Token invalid banner */}
                                {!token && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold flex items-center gap-2 rounded-lg">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>Invalid or missing reset token. Please request a new reset link.</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold flex items-center gap-2 rounded-lg">
                                        <ShieldCheck className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="new-password"
                                                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm text-gray-900 transition-all"
                                                placeholder="Enter new password"
                                                value={form.newPassword}
                                                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                            </button>
                                        </div>
                                        {/* Password Strength Meter */}
                                        {form.newPassword && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-semibold ${strength.level <= 1 ? 'text-red-500' : strength.level === 2 ? 'text-amber-500' : strength.level === 3 ? 'text-blue-500' : 'text-green-500'}`}>
                                                    {strength.label} password
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="new-password"
                                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm text-gray-900 transition-all ${form.confirmPassword && form.newPassword !== form.confirmPassword ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1]'}`}
                                                placeholder="Confirm your new password"
                                                value={form.confirmPassword}
                                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                        {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                                            <p className="text-xs text-red-500 font-semibold mt-1 ml-0.5">Passwords do not match</p>
                                        )}
                                        {form.confirmPassword && form.newPassword === form.confirmPassword && (
                                            <p className="text-xs text-green-500 font-semibold mt-1 ml-0.5 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Passwords match
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !token}
                                        className="w-full bg-[#0D47A1] text-white py-3.5 rounded-lg text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md uppercase mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Reset Password'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Success Screen */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                    <CheckCircle2 className="text-green-500" size={32} />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">Password Reset Successful!</h3>
                                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                    Your password has been updated. You will be redirected to the login page in a moment.
                                </p>
                                <Link
                                    to="/officer/login"
                                    className="inline-flex items-center gap-2 bg-[#0D47A1] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-900 transition-colors"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <Link
                    to="/officer/login"
                    className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0D47A1] transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Login
                </Link>
            </div>

            <div className="pb-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Official Government Portal © 2026
            </div>
        </div>
    );
};

export default OfficerResetPassword;
