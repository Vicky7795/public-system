import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, X, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/auth/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('/auth/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ESCALATION_ALERT': return <AlertTriangle className="text-red-500" size={16} />;
            case 'SLA_WARNING': return <Clock className="text-orange-500" size={16} />;
            case 'STATUS_UPDATE': return <CheckCircle className="text-green-500" size={16} />;
            case 'NEW_ASSIGNMENT': return <Info className="text-blue-500" size={16} />;
            default: return <Bell className="text-gray-500" size={16} />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 max-h-[500px] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Notification Feed</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                                >
                                    Mark all as Read
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-50">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell className="mx-auto text-gray-200 mb-3" size={32} />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Recent Alerts</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n._id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">{getIcon(n.type)}</div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-900 leading-relaxed font-medium">{n.message}</p>
                                                <span className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">
                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
                            <button className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">View All Archive</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
