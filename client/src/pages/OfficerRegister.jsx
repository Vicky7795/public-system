import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { 
    User, Phone, Mail, Lock, Loader2, Building2, 
    ShieldCheck, Eye, EyeOff, UserPlus, LogIn
} from 'lucide-react';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';

const OfficerRegister = () => {
    // Role Toggle: 'Officer' | 'Admin'
    const [mainRole, setMainRole] = useState('Officer');
    
    // Admin Mode: 'Register' | 'Login'
    const [adminMode, setAdminMode] = useState('Register');

    // Form States
    const [officerData, setOfficerData] = useState({ 
        name: '', phone: '', email: '', password: '', role: 'Officer', departmentId: '' 
    });
    const [adminData, setAdminData] = useState({ 
        name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Admin' 
    });
    const [adminLoginData, setAdminLoginData] = useState({ email: '', password: '' });
    
    // UI Helpers
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [officerSecret, setOfficerSecret] = useState('');

    const navigate = useNavigate();

    // Gov Colors
    const primaryBlue = "#0B3D91";
    const govGray = "#6B7280";
    const lightGray = "#F3F4F6";

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
    }, []);

    const handleOfficerSubmit = async (e) => {
        e.preventDefault();
        if (!officerData.departmentId) return setError('This field is required: Department Assigned');
        if (officerSecret !== 'officer123') return setError('Invalid Access Key');
        
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/register', { ...officerData, password: 'officer123' });
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
        if (adminData.password !== adminData.confirmPassword) return setError('Passwords do not match');
        
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/register', adminData);
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

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', adminLoginData);
            if (data.user.role !== 'Admin') throw new Error('Invalid Admin Credentials');
            
            toast.success('Login Successful');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => navigate('/admin'), 1000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Authentication Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Emblem" className="h-10 w-auto" />
                        <div className="leading-tight">
                            <div className="text-sm font-bold text-gray-800">Government of India</div>
                            <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Duty Desk Entry Portal</div>
                        </div>
                    </div>
                    <BackButton fallbackPath="/officer/login" />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
                    
                    {/* Role Selection Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button 
                            onClick={() => { setMainRole('Officer'); setError(''); }}
                            className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors ${mainRole === 'Officer' ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            OFFICER
                        </button>
                        <button 
                            onClick={() => { setMainRole('Admin'); setError(''); }}
                            className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors ${mainRole === 'Admin' ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            ADMIN
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> {error}
                            </div>
                        )}

                        {/* OFFICER FORM */}
                        {mainRole === 'Officer' && (
                            <form onSubmit={handleOfficerSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Officer Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <input
                                            type="text" required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                            placeholder="Enter Full Name"
                                            value={officerData.name}
                                            onChange={(e) => setOfficerData({ ...officerData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Department Assigned</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <select
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700 appearance-none"
                                            onChange={(e) => setOfficerData({ ...officerData, departmentId: e.target.value })}
                                            value={officerData.departmentId}
                                        >
                                            <option value="" disabled>Select Department</option>
                                            {departments.map(dep => <option key={dep._id} value={dep._id}>{dep.departmentName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Duty Contact</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <input
                                            type="tel" required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                            placeholder="10-digit Phone Number"
                                            value={officerData.phone}
                                            onChange={(e) => setOfficerData({ ...officerData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Official Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <input
                                            type="email" required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                            placeholder="e.g. officer@nic.in"
                                            value={officerData.email}
                                            onChange={(e) => setOfficerData({ ...officerData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Secret Access Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                        <input
                                            type="password" required
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                            placeholder="Enter Access Key"
                                            value={officerSecret}
                                            onChange={(e) => setOfficerSecret(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-[#0B3D91] text-white py-3 rounded text-xs font-bold tracking-[0.1em] hover:bg-blue-900 transition-colors shadow-sm mt-4 uppercase">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'REGISTER FOR DUTY'}
                                </button>
                            </form>
                        )}

                        {/* ADMIN PORTAL */}
                        {mainRole === 'Admin' && (
                            <div>
                                {/* Admin Mode Tabs */}
                                <div className="flex justify-center mb-8 gap-10">
                                    <button 
                                        onClick={() => setAdminMode('Register')}
                                        className={`pb-2 text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${adminMode === 'Register' ? 'text-[#0B3D91] border-b-2 border-[#0B3D91]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <UserPlus size={14} /> REGISTER
                                    </button>
                                    <button 
                                        onClick={() => setAdminMode('Login')}
                                        className={`pb-2 text-xs font-bold tracking-wide transition-all flex items-center gap-2 ${adminMode === 'Login' ? 'text-[#0B3D91] border-b-2 border-[#0B3D91]' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <LogIn size={14} /> LOGIN
                                    </button>
                                </div>

                                {adminMode === 'Register' ? (
                                    <form onSubmit={handleAdminRegister} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Admin Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type="text" required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="Full Name"
                                                    value={adminData.name}
                                                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Admin ID / Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type="email" required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="admin@gov.in"
                                                    value={adminData.email}
                                                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Contact Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type="tel" required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="10-digit number"
                                                    value={adminData.phone}
                                                    onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"} required
                                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="Create Password"
                                                    value={adminData.password}
                                                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"} required
                                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="Repeat Password"
                                                    value={adminData.confirmPassword}
                                                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={loading} className="w-full bg-[#0B3D91] text-white py-3 rounded text-xs font-bold tracking-[0.1em] hover:bg-blue-900 transition-colors shadow-sm mt-6 uppercase">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'REGISTER ADMIN'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleAdminLogin} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Admin ID / Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type="email" required
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="admin@gov.in"
                                                    value={adminLoginData.email}
                                                    onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-0.5">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type={showPassword ? "text" : "password"} required
                                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91] outline-none text-sm text-gray-700"
                                                    placeholder="••••••••"
                                                    value={adminLoginData.password}
                                                    onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={loading} className="w-full bg-[#0B3D91] text-white py-3 rounded text-xs font-bold tracking-[0.1em] hover:bg-blue-900 transition-colors shadow-sm mt-4 uppercase">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'LOGIN'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Secondary Option Link */}
                <p className="mt-8 text-center text-gray-500 font-medium text-xs uppercase tracking-widest">
                    Already registered? <Link to="/officer/login" className="text-[#0B3D91] font-bold hover:underline">Officer Login</Link>
                </p>
            </div>

            {/* Footer */}
            <div className="py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                Official Government Portal © 2026
            </div>
        </div>
    );
};

export default OfficerRegister;
