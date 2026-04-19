import React from 'react';

/**
 * SummaryCard - A standardized, official-grade metric display component.
 * Used across Citizen, Officer, and Admin dashboards for consistency.
 */
const SummaryCard = ({ label, value, color, icon }) => {
    const configs = {
        blue: { border: 'border-l-[#1D4ED8]', text: 'text-[#1D4ED8]' },
        orange: { border: 'border-l-[#EA580C]', text: 'text-[#EA580C]' },
        green: { border: 'border-l-[#16A34A]', text: 'text-[#16A34A]' },
        purple: { border: 'border-l-[#7C3AED]', text: 'text-[#7C3AED]' },
        amber: { border: 'border-l-[#D97706]', text: 'text-[#D97706]' },
        red: { border: 'border-l-[#DC2626]', text: 'text-[#DC2626]' }
    };

    const config = configs[color] || configs.blue;

    return (
        <div className={`bg-white border border-gray-200 ${config.border} border-l-4 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">{label}</p>
                    <h4 className="text-3xl font-bold text-gray-900 leading-none">{value}</h4>
                </div>
                <div className={`${config.text} opacity-20 group-hover:opacity-40 transition-opacity`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;
