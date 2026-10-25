'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { LuCheck, LuLaptop, LuPalette, LuSparkles } from 'react-icons/lu';

export default function ThemeSwitcher({ variant = 'dropdown', className = '' }) {
    const { theme, resolvedTheme, setTheme, themes, mounted } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!mounted) {
        return (
            <div className={`h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 border border-white/10 animate-pulse ${className}`} />
        );
    }

    const currentConfig = themes.find((t) => t.id === resolvedTheme) || themes[0];

    // Grid / Detailed view for Settings / Profile page
    if (variant === 'grid') {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {themes.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTheme(t.id)}
                                className={`text-left p-4 rounded-2xl border transition-all duration-200 nutri-press relative overflow-hidden flex flex-col justify-between ${
                                    isSelected
                                        ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 bg-[var(--bg-card-elevated)]'
                                        : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-[var(--text-primary)]">{t.name}</span>
                                            {t.id === 'ai-nebula' && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                                                    Signature
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-black dark:text-black flex items-center justify-center text-xs font-bold shadow-xs">
                                                <LuCheck className="text-white" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3.5 leading-relaxed">
                                        {t.description}
                                    </p>
                                </div>

                                {/* Swatch Preview Bar */}
                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                                        {t.type}
                                    </span>
                                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                                        <span className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.palette.bg }} title="Background" />
                                        <span className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.palette.card }} title="Surface" />
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.palette.accent }} title="Accent" />
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.palette.secondaryAccent }} title="Secondary Accent" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Follow System Option */}
                <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`w-full p-3.5 rounded-2xl border transition-all duration-200 nutri-press flex items-center justify-between ${
                        theme === 'system'
                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 bg-[var(--bg-card-elevated)]'
                            : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                            <LuLaptop className="text-lg" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-semibold text-[var(--text-primary)]">Follow System Preference</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">Automatically switch between AI Nebula (Dark) and Clinical Light (Light)</p>
                        </div>
                    </div>
                    {theme === 'system' && (
                        <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                            <LuCheck />
                        </span>
                    )}
                </button>
            </div>
        );
    }

    // Dropdown / Header Trigger
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-primary)] transition-all duration-180 nutri-press shadow-xs"
                title={`Active Theme: ${currentConfig.name}`}
                aria-label="Theme selector"
                aria-expanded={isOpen}
            >
                <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shrink-0 shadow-xs"
                    style={{ backgroundColor: currentConfig.palette.accent }}
                />
                <span className="text-xs font-medium tracking-tight hidden sm:inline">{currentConfig.name}</span>
                <LuPalette className="text-xs text-[var(--text-muted)]" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 p-2.5 rounded-2xl nutri-glass border border-[var(--border-color)] shadow-2xl z-50 animate-slide-up space-y-1">
                    <div className="px-2 py-1.5 flex items-center justify-between border-b border-[var(--border-color)] mb-1">
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Select Visual Theme
                        </span>
                        <span className="text-[10px] text-[var(--accent-primary)] font-medium flex items-center gap-1">
                            <LuSparkles className="text-xs" /> 6 Themes
                        </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                        {themes.map((t) => {
                            const isSelected = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setTheme(t.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/20'
                                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10"
                                                style={{ backgroundColor: t.palette.card }}
                                            />
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: t.palette.accent }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">{t.name}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-normal">{t.subtitle}</p>
                                        </div>
                                    </div>
                                    {isSelected && <LuCheck className="text-sm shrink-0" />}
                                </button>
                            );
                        })}

                        <div className="pt-1 mt-1 border-t border-[var(--border-color)]">
                            <button
                                type="button"
                                onClick={() => {
                                    setTheme('system');
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                                    theme === 'system'
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/20'
                                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <LuLaptop className="text-sm text-[var(--text-muted)]" />
                                    <div>
                                        <p className="font-medium">Follow System</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-normal">Auto light / dark</p>
                                    </div>
                                </div>
                                {theme === 'system' && <LuCheck className="text-sm shrink-0" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
