'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

export const THEMES = [
    {
        id: 'ai-nebula',
        name: 'AI Nebula',
        subtitle: 'Signature Theme',
        description: 'Deep navy, restrained violet accents & intelligent wellness clarity',
        type: 'dark',
        palette: {
            bg: '#0B1020',
            card: '#151D33',
            elevated: '#1D2742',
            text: '#F4F6FF',
            secondaryText: '#9AA7C7',
            border: '#293653',
            accent: '#9B8CFF',
            secondaryAccent: '#6C7CFF',
        },
    },
    {
        id: 'midnight-mint',
        name: 'Midnight Mint',
        subtitle: 'Clean & Precise',
        description: 'Restrained dark aesthetic with calming mint nutrition accents',
        type: 'dark',
        palette: {
            bg: '#0B0F14',
            card: '#151B23',
            elevated: '#1B2430',
            text: '#F3F6FA',
            secondaryText: '#96A2B4',
            border: '#283241',
            accent: '#45D6A0',
            secondaryAccent: '#64B5F6',
        },
    },
    {
        id: 'clinical-light',
        name: 'Clinical Light',
        subtitle: 'Pure & Professional',
        description: 'Trustworthy, crisp white surfaces with medical-grade clarity',
        type: 'light',
        palette: {
            bg: '#F4F7FB',
            card: '#FFFFFF',
            elevated: '#EDF2F8',
            text: '#182230',
            secondaryText: '#65748B',
            border: '#E1E7F0',
            accent: '#635BDB',
            secondaryAccent: '#168A70',
        },
    },
    {
        id: 'aurora',
        name: 'Aurora',
        subtitle: 'Analytical & Energetic',
        description: 'Controlled electric blue-violet depth for high-focus tracking',
        type: 'dark',
        palette: {
            bg: '#0C1224',
            card: '#17223B',
            elevated: '#202E4C',
            text: '#F5F7FF',
            secondaryText: '#A2B0D0',
            border: '#2B3A59',
            accent: '#6EA8FE',
            secondaryAccent: '#B69CFF',
        },
    },
    {
        id: 'forest-wellness',
        name: 'Forest Wellness',
        subtitle: 'Organic & Grounding',
        description: 'Deep woodland greens connected to natural and sustainable habits',
        type: 'dark',
        palette: {
            bg: '#101914',
            card: '#1B2A21',
            elevated: '#25382B',
            text: '#F0F7F0',
            secondaryText: '#A3B9A5',
            border: '#314839',
            accent: '#8AD7A0',
            secondaryAccent: '#D5E6A1',
        },
    },
    {
        id: 'warm-minimal',
        name: 'Warm Minimal',
        subtitle: 'Soft & Approachable',
        description: 'Warm neutral tones, gentle borders, and muted terracotta accents',
        type: 'light',
        palette: {
            bg: '#F8F5F0',
            card: '#FFFFFF',
            elevated: '#F0EAE1',
            text: '#292D35',
            secondaryText: '#777A83',
            border: '#E8E0D6',
            accent: '#D96D62',
            secondaryAccent: '#8072D8',
        },
    },
];

const ThemeContext = createContext({
    theme: 'ai-nebula',
    resolvedTheme: 'ai-nebula',
    themeConfig: THEMES[0],
    isDark: true,
    setTheme: () => {},
    toggleTheme: () => {},
    themes: THEMES,
    mounted: false,
});

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('ai-nebula');
    const [resolvedTheme, setResolvedTheme] = useState('ai-nebula');
    const [mounted, setMounted] = useState(false);

    const applyTheme = (targetTheme) => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        let effective = targetTheme;

        if (targetTheme === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            effective = prefersDark ? 'ai-nebula' : 'clinical-light';
        }

        const validTheme = THEMES.find((t) => t.id === effective) ? effective : 'ai-nebula';
        setResolvedTheme(validTheme);

        // Update root attributes for CSS variables and styling
        root.setAttribute('data-theme', validTheme);
        const config = THEMES.find((t) => t.id === validTheme) || THEMES[0];
        const isDarkTheme = config.type === 'dark';

        if (isDarkTheme) {
            root.classList.add('dark');
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            root.style.colorScheme = 'light';
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('nutrisnap-theme') || 'ai-nebula';
        setThemeState(saved);
        applyTheme(saved);
        setMounted(true);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            const current = localStorage.getItem('nutrisnap-theme') || 'ai-nebula';
            if (current === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleSystemChange);
        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, []);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem('nutrisnap-theme', newTheme);
        } catch (e) {
            console.error('Failed to persist theme:', e);
        }
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        // Quick toggle cycles between AI Nebula (Dark default) and Clinical Light (Light)
        const next = resolvedTheme === 'clinical-light' ? 'ai-nebula' : 'clinical-light';
        setTheme(next);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(8);
        }
    };

    const currentThemeConfig = useMemo(() => {
        return THEMES.find((t) => t.id === resolvedTheme) || THEMES[0];
    }, [resolvedTheme]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                resolvedTheme,
                themeConfig: currentThemeConfig,
                isDark: currentThemeConfig.type === 'dark',
                setTheme,
                toggleTheme,
                themes: THEMES,
                mounted,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
