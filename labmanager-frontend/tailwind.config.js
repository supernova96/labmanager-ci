/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563EB", // Blue 600
                secondary: "#4F46E5", // Indigo 600
                dark: "#0F172A", // Slate 900
                light: "#F8FAFC", // Slate 50
            }
        },
    },
    darkMode: 'class',
    plugins: [],
}
