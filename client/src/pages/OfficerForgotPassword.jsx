import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Mail, Loader2, ShieldCheck, CheckCircle2,
    ArrowLeft, Lock, Eye, EyeOff, RefreshCw, AlertCircle
} from 'lucide-react';

const SAFFRON = '#FF9933';
const GREEN = '#138808';
const BLUE = '#0D47A1';

// ─── Step Indicator ───────────────────────────────────────────────
const StepBar = ({ step }) => {
    const steps = ['Email', 'OTP', 'New Password'];
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((label, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                            ${step > i ? 'bg-green-500 border-green-500 text-white'
                            : step === i ? 'bg-[#0D47A1] border-[#0D47A1] text-white'
                            : 'bg-white border-gray-200 text-gray-400'}`}>
                            {step > i ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold mt-1 ${step >= i ? 'text-[#0D47A1]' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`w-12 h-0.5 mb-4 mx-1 transition-all ${step > i ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
};

// ─── OTP Input Boxes ───────────────────────────────────────────────
const OtpBoxes = ({ value, onChange }) => {
    const inputs = useRef([]);
    const digits = value.split('');

    const handleChange = (e, idx) => {
        const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[idx] = val;
        onChange(newDigits.join(''));
        if (val && idx < 5) inputs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        inputs.current[Math.min(pasted.length, 5)]?.focus();
        e.preventDefault();
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array(6).fill(0).map((_, idx) => (
                <input
                    key={idx}
                    ref={el => inputs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[idx] || ''}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all
                        focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/20
                        border-gray-200 text-gray-900 bg-gray-50 focus:bg-white"
                />
            ))}
        </div>
    );
};

// ─── Password Strength ────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const configs = [
        { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-500' },
        { label: 'Weak', color: 'bg-red-400', text: 'text-red-400' },
        { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-500' },
        { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' },
        { label: 'Strong', color: 'bg-green-500', text: 'text-green-600' },
    ];
    const cfg = configs[score];
    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < score ? cfg.color : 'bg-gray-200'}`} />
                ))}
            </div>
            <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label} password</p>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────
const OfficerForgotPassword = () => {
    const navigate = useNavigate();

    // Step: 0=email, 1=otp, 2=newpassword, 3=done
    const [step, setStep] = useState(0);

    // Step 1
    const [email, setEmail] = useState('');
    const [demoOtp, setDemoOtp] = useState('');

    // Step 2
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(300); // 5 min
    const [resetToken, setResetToken] = useState('');

    // Step 3
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [showPwd, setShowPwd] = useState(false);

    // Shared
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Timer countdown for OTP
    useEffect(() => {
        if (step !== 1) return;
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    // ── Send OTP ──────────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        setLoading(true); setError(''); setDemoOtp('');
        try {
            const { data } = await api.post('/auth/send-otp', { email });
            setDemoOtp(data.demoOtp || '');
            setSuccess(data.message);
            setTimer(300);
            setOtp('');
            setStep(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Verify OTP ────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        if (otp.length < 6) return setError('Please enter the complete 6-digit OTP.');
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setResetToken(data.resetToken);
            setSuccess('OTP verified! Set your new password.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    // ── Reset Password ────────────────────────────────────────────
    const handleResetPassword = async (e) => {
        e?.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return setError('Passwords do not match.');
        if (passwords.newPassword.length < 6) return setError('Password must be at least 6 characters.');
        setLoading(true); setError('');
        try {
            await api.post('/auth/reset-password', { token: resetToken, newPassword: passwords.newPassword });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">

                {/* Header */}
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="Emblem" className="h-16 w-auto mx-auto mb-3 object-contain" />
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide">Government of India</h1>
                    <div className="flex justify-center my-2">
                        <div className="flex h-1 w-20 rounded overflow-hidden">
                            <div className="flex-1" style={{ background: SAFFRON }} />
                            <div className="flex-1 bg-white border-y border-gray-200" />
                            <div className="flex-1" style={{ background: GREEN }} />
                        </div>
                    </div>
                    <p className="text-[#0D47A1] font-bold tracking-widest uppercase text-xs">Duty Desk Entry Portal</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_15px_40px_-15px_rgba(13,71,161,0.2)] border border-gray-100 overflow-hidden">

                    {/* Blue Header */}
                    <div className="bg-[#0D47A1] px-6 py-4">
                        <h2 className="text-white font-bold text-lg">
                            {step === 0 && 'Password Recovery'}
                            {step === 1 && 'OTP Verification'}
                            {step === 2 && 'Set New Password'}
                            {step === 3 && 'Password Reset Complete'}
                        </h2>
                        <p className="text-blue-200 text-xs mt-0.5">Officer & Admin Account Reset</p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {step < 3 && <StepBar step={step} />}

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold flex items-center gap-2 rounded-lg">
                                <AlertCircle size={15} className="shrink-0" /> {error}
                            </div>
                        )}

                        {/* ── STEP 0: Email ── */}
                        {step === 0 && (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <p className="text-sm text-gray-500 mb-4">Enter your registered official email to receive an OTP.</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Official Email ID</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                                        <input
                                            type="email" required autoComplete="username"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm transition-all"
                                            placeholder="your.email@gov.in"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full bg-[#0D47A1] text-white py-3.5 rounded-lg text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md uppercase">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Send OTP'}
                                </button>
                            </form>
                        )}

                        {/* ── STEP 1: OTP ── */}
                        {step === 1 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <p className="text-sm text-gray-500 text-center">OTP sent to <strong>{email}</strong></p>

                                {/* Demo OTP Banner */}
                                {demoOtp && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Demo OTP (Remove in Production)</p>
                                        <p className="text-3xl font-black tracking-[0.3em] text-[#0D47A1]">{demoOtp}</p>
                                    </div>
                                )}

                                {/* OTP Boxes */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-3 text-center">Enter 6-Digit OTP</label>
                                    <OtpBoxes value={otp} onChange={setOtp} />
                                </div>

                                {/* Timer */}
                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-sm text-gray-500">
                                            OTP expires in <span className={`font-bold ${timer < 60 ? 'text-red-500' : 'text-[#0D47A1]'}`}>{formatTime(timer)}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-red-500 font-semibold">OTP expired.</p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading || otp.length < 6}
                                    className="w-full bg-[#0D47A1] text-white py-3.5 rounded-lg text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md uppercase disabled:opacity-50">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Verify OTP'}
                                </button>

                                <button type="button" onClick={() => { setStep(0); setError(''); setOtp(''); }}
                                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#0D47A1] font-semibold transition-colors">
                                    <RefreshCw size={14} /> Resend OTP
                                </button>
                            </form>
                        )}

                        {/* ── STEP 2: New Password ── */}
                        {step === 2 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                                        <input
                                            type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] outline-none text-sm transition-all"
                                            placeholder="Create strong password"
                                            value={passwords.newPassword}
                                            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={passwords.newPassword} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                                        <input
                                            type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm transition-all
                                                ${passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword
                                                    ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1]'}`}
                                            placeholder="Repeat password"
                                            value={passwords.confirmPassword}
                                            onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                    {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                                        <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match</p>
                                    )}
                                    {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && (
                                        <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full bg-[#0D47A1] text-white py-3.5 rounded-lg text-sm font-bold tracking-widest hover:bg-blue-900 transition-colors shadow-md uppercase mt-2">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        {/* ── STEP 3: Done ── */}
                        {step === 3 && (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                    <CheckCircle2 className="text-green-500" size={32} />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">All Done!</h3>
                                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                    Your password has been reset successfully. You can now login with your new password.
                                </p>
                                <Link to="/officer/login"
                                    className="inline-flex items-center gap-2 bg-[#0D47A1] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-900 transition-colors">
                                    Go to Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <Link to="/officer/login" className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0D47A1] transition-colors">
                    <ArrowLeft size={16} /> Back to Login
                </Link>
            </div>

            <div className="pb-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Official Government Portal © 2026
            </div>
        </div>
    );
};

export default OfficerForgotPassword;
