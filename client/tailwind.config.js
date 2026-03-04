/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                govBlue: {
                    light: '#3b82f6',
                    DEFAULT: '#1e40af',
                    dark: '#1e3a8a',
                },
                premiumGold: '#d4af37',
            },
        },
    },
    plugins: [],
}
