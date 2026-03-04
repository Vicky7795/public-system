import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
    Plus,
    Edit2,
    Trash2,
    Building2,
    Clock,
    Percent,
    ArrowLeft,
    Search,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentDep, setCurrentDep] = useState({ departmentName: '', description: '', slaHours: 48 });
    const [editingId, setEditingId] = useState(null);

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/departments');
            setDepartments(data);
        } catch {
            console.error('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/departments/${editingId}`, currentDep);
            } else {
                await api.post('/departments', currentDep);
            }
            fetchDepartments();
            setShowModal(false);
            setCurrentDep({ departmentName: '', description: '', slaHours: 48 });
            setEditingId(null);
        } catch {
            alert('Operation failed');
        }
    };

    const deleteDep = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchDepartments();
        } catch {
            alert('Delete failed');
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-govBlue" /></div>;

    return (
        <div className="container mx-auto p-8 max-w-7xl animate-fade-in-up">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <Link to="/admin" className="text-slate-500 flex items-center gap-2 mb-2 font-black text-[10px] uppercase tracking-widest hover:text-govBlue transition-all">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Department Management</h1>
                    <p className="text-slate-500 font-medium">Configure resource silos and SLA targets</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setCurrentDep({ departmentName: '', description: '', slaHours: 48 }); }}
                    className="bg-govBlue text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={18} /> Add Department
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dep) => (
                    <div key={dep._id} className="glass p-8 rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-govBlue group-hover:text-white transition-colors">
                                <Building2 size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(dep._id); setCurrentDep(dep); setShowModal(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-govBlue transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => deleteDep(dep._id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 mb-2 truncate">{dep.departmentName}</h3>
                        <p className="text-slate-400 text-sm mb-8 line-clamp-2 h-10 font-medium">{dep.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Clock size={12} /> SLA Target
                                </div>
                                <div className="text-xl font-black text-slate-700">{dep.slaHours}h</div>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Percent size={12} /> Efficiency
                                </div>
                                <div className="text-xl font-black text-green-600">{dep.slaPerformance}%</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dep.totalComplaints} Active Cases</span>
                            <div className="flex items-center -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        {i === 2 ? '+' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl border border-white/20">
                        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">
                            {editingId ? 'Refine Department' : 'Initialize Department'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Department Name</label>
                                <input
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={currentDep.departmentName}
                                    onChange={(e) => setCurrentDep({ ...currentDep, departmentName: e.target.value })}
                                    required placeholder="e.g. Water Resources"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Operational Description</label>
                                <textarea
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none min-h-[100px]"
                                    value={currentDep.description}
                                    onChange={(e) => setCurrentDep({ ...currentDep, description: e.target.value })}
                                    placeholder="Brief summary of duties..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">SLA Threshold (Hours)</label>
                                <input
                                    type="number"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-govBlue focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={currentDep.slaHours}
                                    onChange={(e) => setCurrentDep({ ...currentDep, slaHours: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-govBlue text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:shadow-blue-300 transition-all">
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments;
