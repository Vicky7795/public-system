import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Admin'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Admin Account Created Successfully!');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
                    Secret Admin Access
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Create a new system administrator account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 sm:rounded-3xl border border-slate-100">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="e.g. Master Admin"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="admin@gov.in"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Contact Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="10-digit number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                Secure Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-200 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Register as Administrator'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;
