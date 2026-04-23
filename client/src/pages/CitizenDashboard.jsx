import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Plus, Search, Calendar, Filter, Radar, FileText,
    ChevronRight, MapPin, ClipboardList, CheckCircle2,
    ShieldCheck, Building2, ArrowRight, X
} from 'lucide-react';

import BackButton from '../components/BackButton';
import NotificationCenter from '../components/NotificationCenter';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const CitizenDashboard = () => {
    const { t } = useTranslation();
    const [complaints, setComplaints] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        let currentRole = null;
        try { currentRole = JSON.parse(localStorage.getItem('user'))?.role; } catch {}
        if (!token || currentRole !== 'Citizen') {
            navigate('/citizen/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [complaintsRes, departmentsRes] = await Promise.all([
                    api.get('/complaints/my'),
                    api.get('/departments')
                ]);
                setComplaints(complaintsRes.data);
                setDepartments(departmentsRes.data);
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Filter Logic
    const filteredComplaints = complaints.filter(c => {
        if (!c) return false;
        const q = debouncedSearch.toLowerCase().trim();
        const matchesSearch = c.ticketId?.toLowerCase().includes(q) || 
                             c.title?.toLowerCase().includes(q) ||
                             c.category?.toLowerCase().includes(q) ||
                             c.description?.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
        return (q ? matchesSearch : true) && matchesStatus && matchesCategory;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    const currentItems = filteredComplaints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return (
        <div className="flex flex-col h-[80vh] items-center justify-center gap-4 bg-[#F9FAFB]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1D4ED8] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading Official Data...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9FAFB] pb-20">
            {/* Top Branding Bar */}
            <div className="bg-white border-b border-gray-200 py-3 mb-8">
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block" />
                        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest hidden sm:block">{t('common.branding.portal_version')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <LanguageSwitcher />
                        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1D4ED8] rounded-lg border border-blue-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t('dashboard.secured_session')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 max-w-7xl animate-in fade-in duration-500">
                {/* Header & Main Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                    <div className="w-full lg:w-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">{t('dashboard.welcome')}, {user?.name}</h1>
                        <p className="text-sm text-gray-500 font-medium">{t('dashboard.manage_grievances')}</p>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <Link to="/track" className="flex-1 lg:flex-none bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Search size={18} /> {t('dashboard.track_complaint')}
                        </Link>
                        <Link to="/submit" className="flex-1 lg:flex-none bg-[#1D4ED8] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#1e40af] transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Plus size={18} /> {t('dashboard.file_complaint')}
                        </Link>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <SummaryCard label={t('dashboard.metrics.total')} value={complaints.length} color="blue" icon={<ClipboardList size={24} />} />
                    <SummaryCard label={t('dashboard.metrics.in_progress')} value={complaints.filter(c => ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED', 'OVERDUE', 'ESCALATED'].includes(c.status)).length} color="orange" icon={<Calendar size={24} />} />
                    <SummaryCard label={t('dashboard.metrics.resolved')} value={complaints.filter(c => c.status === 'RESOLVED').length} color="green" icon={<CheckCircle2 size={24} />} />
                </div>

                {/* Filters Row */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder={t('dashboard.search')}
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                            {t(filteredComplaints.length === 1 ? 'dashboard.results_found' : 'dashboard.results_found_plural', { count: filteredComplaints.length })}
                        </div>
                        <select 
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white outline-none font-medium text-gray-700"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">{t('dashboard.filters.all_statuses')}</option>
                            <option value="NEW">{t('status.pending')}</option>
                            <option value="IN_PROGRESS">{t('status.in_progress')}</option>
                            <option value="RESOLVED">{t('status.resolved')}</option>
                        </select>
                        <select 
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white outline-none font-medium text-gray-700"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">{t('dashboard.filters.all_departments')}</option>
                            {departments.map(d => (
                                <option key={d._id} value={d.departmentName}>{d.departmentName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grievance Table/List */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Desktop Table Header */}
                    <div className="hidden lg:grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-4">
                        <div className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.table.ticket_id')}</div>
                        <div className="col-span-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.table.subject')}</div>
                        <div className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.table.priority')}</div>
                        <div className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.table.status')}</div>
                        <div className="col-span-2 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.table.actions')}</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {currentItems.length > 0 ? (
                            currentItems.map((c) => (
                                <div key={c._id} className="lg:grid lg:grid-cols-12 items-center px-6 py-5 hover:bg-gray-50/50 transition-colors group">
                                    {/* Mobile/Shared Header */}
                                    <div className="col-span-2 mb-3 lg:mb-0">
                                        <span className="font-mono text-[12px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-1 rounded">#{c.ticketId}</span>
                                        <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase lg:hidden">{new Date(c.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* Subject */}
                                    <div className="col-span-4 mb-4 lg:mb-0">
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1D4ED8] transition-colors line-clamp-1">{c.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                                                <Building2 size={12} /> {c.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div className="col-span-2 mb-4 lg:mb-0">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight
                                            ${(c.priorityLevel || c.priority) === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                            {(c.priorityLevel || c.priority || 'Medium')}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 mb-6 lg:mb-0">
                                         <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold
                                             ${c.status === 'RESOLVED' ? 'text-green-600' : (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') ? 'text-orange-600' : 'text-gray-500'}`}>
                                             <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'RESOLVED' ? 'bg-green-600' : (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') ? 'bg-orange-600' : 'bg-gray-400'}`} />
                                             {c.status}
                                         </span>
                                     </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end">
                                        <button 
                                            onClick={() => navigate('/track', { state: { prefill: c.ticketId } })}
                                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 hover:text-[#111827] transition-all flex items-center gap-2"
                                        >
                                            {t('dashboard.view_details')} <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <Search size={40} className="mx-auto text-gray-200 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">{t('dashboard.no_matching')}</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">{t('dashboard.no_matching_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-4 sm:px-6 py-4 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center sm:text-left">
                            Showing <span className="text-[#1D4ED8]">{currentItems.length}</span> of <span className="text-gray-900">{filteredComplaints.length}</span> records
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-gray-50 transition-all hover:border-gray-300"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1 px-4">
                                <span className="text-xs font-bold text-gray-900">{currentPage}</span>
                                <span className="text-xs font-bold text-gray-400">/</span>
                                <span className="text-xs font-bold text-gray-400">{totalPages}</span>
                            </div>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-gray-50 transition-all hover:border-gray-300"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, color, icon }) => {
    const configs = {
        blue: { border: 'border-l-[#1D4ED8]', text: 'text-[#1D4ED8]' },
        orange: { border: 'border-l-[#EA580C]', text: 'text-[#EA580C]' },
        green: { border: 'border-l-[#16A34A]', text: 'text-[#16A34A]' }
    };

    return (
        <div className={`bg-white border border-gray-200 ${configs[color].border} border-l-4 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">{label}</p>
                    <h4 className="text-3xl font-bold text-gray-900 leading-none">{value}</h4>
                </div>
                <div className={`${configs[color].text} opacity-20`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default CitizenDashboard;
