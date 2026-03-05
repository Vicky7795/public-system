import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Phone, Mail, Lock, Loader2, ShieldPlus, Building2 } from 'lucide-react';

const OfficerRegister = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: 'officer123', role: 'Officer', departmentId: '' });
    const [secretKey, setSecretKey] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.departmentId) {
            setError('Please select a department from the list.');
            return;
        }
        if (secretKey !== 'officer123') {
            setError('Invalid Secret Access Key. Please contact your administrator.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/register', formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setSuccess(true);
            setTimeout(() => navigate('/officer'), 1000);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg) {
                setError(msg);
            } else if (err.request) {
                setError('Cannot reach the server. Please check if services are running.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-100">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-md border border-slate-200">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-900 p-4 rounded-3xl text-white shadow-lg">
                        <ShieldPlus size={40} />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Duty Desk Entry</h2>
                <p className="text-slate-500 text-center mb-8 font-medium">Official Grievance Officer Registration</p>

                {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">{error}</div>}
                {success && <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-sm font-bold border border-green-100">✅ Registered successfully! Redirecting...</div>}
                {departments.length === 0 && !success && <div className="bg-yellow-50 text-yellow-700 p-3 rounded-2xl mb-4 text-xs font-bold border border-yellow-100">⚠️ No departments found. Ask admin to create departments first.</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Officer Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text" required
                                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                                    placeholder="e.g. Inspector Sharma"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Department Assigned</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    required
                                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm appearance-none"
                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                    value={formData.departmentId}
                                >
                                    <option value="" disabled>Select Department</option>
                                    {departments.map(dep => (
                                        <option key={dep._id} value={dep._id}>{dep.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Duty Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="tel" required
                                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                                    placeholder="+91-XXXXXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Official NIC Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email" required
                                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                                    placeholder="officer@nic.in"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Secret Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                                    placeholder="Enter secret key to register"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-300 hover:bg-black hover:-translate-y-0.5 transition-all flex justify-center items-center mt-6">
                        {loading ? <Loader2 className="animate-spin text-white" /> : 'Register for Duty'}
                    </button>
                </form>
                <p className="mt-8 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
                    Access existing account? <Link to="/officer/login" className="text-slate-900 hover:underline">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default OfficerRegister;

