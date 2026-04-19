import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGE_OPTIONS = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' }
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const currentLang = i18n.language || 'en';

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <div className="flex items-center gap-2 bg-white/50 border border-blue-100 rounded-full px-3 py-1.5 shadow-sm">
            <Globe size={14} className="text-[#1D4ED8]" />
            <select
                className="bg-transparent text-[10px] sm:text-xs font-black text-[#1E3A8A] uppercase tracking-wider outline-none cursor-pointer hover:text-blue-600 transition-colors"
                value={currentLang}
                onChange={handleLanguageChange}
            >
                {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-gray-900 font-sans normal-case">
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
