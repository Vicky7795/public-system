import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Phone, Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const CitizenForgotPassword = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const prefilledEmail = queryParams.get('email') || 'citizen@nic.in';

    const [formData, setFormData] = useState({
        email: prefilledEmail,
        phone: '',
        newPassword: '',
        confirmPassword: '',
        emailOptIn: true // Default to true for better UX
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0); // 0-3
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const { t } = useTranslation();
    const navigate = useNavigate();

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length > 7) strength++;
        if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(formData.newPassword));
    }, [formData.newPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: t('common.auth.passwords_mismatch') });
        }
        if (passwordStrength < 1) {
            return setStatus({ type: 'error', message: t('common.auth.password_weak') });
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const { data } = await api.post('/auth/reset-password', {
                email: formData.email,
                phone: formData.phone,
                newPassword: formData.newPassword,
                emailOptIn: formData.emailOptIn
            });
            setStatus({ type: 'success', message: data.message || t('common.auth.reset_success') });
            setTimeout(() => navigate('/citizen/login'), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.message || t('common.auth.reset_failed') });
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength === 0) return 'bg-gray-200';
        if (passwordStrength === 1) return 'bg-red-400';
        if (passwordStrength === 2) return 'bg-amber-400';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (passwordStrength === 0) return t('common.auth.strength_levels.too_weak');
        if (passwordStrength === 1) return t('common.auth.strength_levels.weak');
        if (passwordStrength === 2) return t('common.auth.strength_levels.medium');
        return t('common.auth.strength_levels.strong');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#EEF2FF] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-gray-500 hover:text-[#1E3A8A] transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">{t('common.auth.home')}</span>
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100/50 text-[#1E3A8A] border border-blue-200/50">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('common.auth.secured_session')}</span>
                    </div>
                </div>

                {/* Reset Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[20px] border border-gray-100 shadow-xl shadow-blue-900/5 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]" />

                    <div className="mb-10">
                        <h1 className="text-2xl font-bold text-gray-900 leading-none tracking-[-0.4px] mb-2">{t('common.auth.reset_password')}</h1>
                        <p className="text-sm font-medium text-gray-500">{t('common.auth.verify_identity')}</p>
                    </div>

                    {status.message && (
                        <div className={`p-4 rounded-xl mb-8 flex items-start gap-3 border animate-shake
                            ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <span className="text-xs font-bold">{status.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email - Editable */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-[0.5px]">{t('common.auth.registered_email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
                                <input
                                    type="email" 
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-800 font-medium text-sm placeholder:text-gray-300"
                                    placeholder={t('common.auth.email_placeholder')}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            {/* Email Opt-in */}
                            <div className="flex items-center gap-2 mt-3 px-1">
                                <label className="relative flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.emailOptIn}
                                        onChange={(e) => setFormData({ ...formData, emailOptIn: e.target.checked })}
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]"></div>
                                </label>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('common.auth.send_confirmation_email')}</span>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-[0.5px]">{t('common.auth.phone_label')}</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
                                <input
                                    type="tel" 
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-800 font-medium text-sm placeholder:text-gray-300"
                                    placeholder={t('common.auth.phone_placeholder')}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-[0.5px]">{t('common.auth.new_password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'} 
                                    required
                                    autoComplete="new-password"
                                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-800 font-medium text-sm placeholder:text-gray-300"
                                    placeholder={t('common.auth.password_placeholder')}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Strength Indicator */}
                            {formData.newPassword && (
                                <div className="mt-2 flex flex-col gap-1 px-1">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.auth.strength')}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${passwordStrength === 3 ? 'text-green-500' : 'text-gray-400'}`}>
                                            {getStrengthText()}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                                        {[1, 2, 3].map((step) => (
                                            <div 
                                                key={step} 
                                                className={`h-full flex-1 transition-all duration-500 ${step <= passwordStrength ? getStrengthColor() : 'bg-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-[0.5px]">{t('common.auth.confirm_password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
                                <input
                                    type="password" 
                                    required
                                    autoComplete="new-password"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-800 font-medium text-sm placeholder:text-gray-300"
                                    placeholder={t('common.auth.password_placeholder')}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || status.type === 'success'}
                            className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3 mt-4 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : t('common.auth.update_password_btn')}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <Link to="/citizen/login" className="text-xs font-bold text-[#1E3A8A] hover:underline uppercase tracking-widest">
                            {t('common.auth.return_login')}
                        </Link>
                    </div>
                </div>

                {/* Footer Trust Indicators */}
                <div className="mt-8 flex flex-col items-center gap-3 opacity-60">
                    <div className="flex items-center gap-2 text-[#1E3A8A] font-black text-[10px] uppercase tracking-[0.25em]">
                        <ShieldCheck size={14} /> {t('common.auth.secure_gov_portal')}
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('common.auth.data_encrypted')}</p>
                </div>
            </div>
        </div>
    );
};

export default CitizenForgotPassword;

