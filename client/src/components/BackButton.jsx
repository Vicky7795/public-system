import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Universal Back Button component for the AI Public Grievance System.
 * Handles browser history navigation with a smart fallback mechanism.
 */
const BackButton = ({ fallbackPath, className = "" }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        // Check if we have a history stack within the app
        // location.key is 'default' for the first page loaded in the app session
        const hasHistory = window.history.length > 1 && location.key !== 'default';

        if (hasHistory) {
            navigate(-1);
        } else {
            // Fallback logic if no history is available
            if (fallbackPath) {
                navigate(fallbackPath);
            } else {
                // Persistent context-aware fallback
                try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (user?.role === 'Citizen') navigate('/dashboard');
                    else if (user?.role === 'Officer') navigate('/officer');
                    else if (user?.role === 'Admin') navigate('/admin');
                    else navigate('/');
                } catch (e) {
                    navigate('/');
                }
            }
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2.5 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-govBlue transition-all group bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl hover:border-govBlue/30 hover:shadow-2xl hover:shadow-blue-900/10 active:scale-95 shadow-sm ${className}`}
            aria-label="Go back to previous page"
        >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back</span>
        </button>
    );
};

export default BackButton;
