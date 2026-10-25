'use client';

import ThemeSwitcher from './ThemeSwitcher';

export default function ThemeToggle({ variant = 'icon', className = '' }) {
    if (variant === 'segmented' || variant === 'grid') {
        return <ThemeSwitcher variant="grid" className={className} />;
    }
    return <ThemeSwitcher variant="dropdown" className={className} />;
}
