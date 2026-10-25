'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import { UserButton } from '@clerk/nextjs';
import {
    LuActivity,
    LuCamera,
    LuUtensils,
    LuTrendingUp,
    LuSparkles,
    LuTarget,
    LuSettings,
    LuChevronLeft,
    LuChevronRight,
} from 'react-icons/lu';

const NAV_ITEMS = [
    { href: '/', label: 'Today', icon: LuActivity, badge: null },
    { href: '/scan', label: 'AI Food Scanner', icon: LuCamera, badge: 'AI' },
    { href: '/log', label: 'Nutrition History', icon: LuUtensils, badge: null },
    { href: '/analytics', label: 'Health Analytics', icon: LuTrendingUp, badge: null },
    { href: '/insights', label: 'Health Insights', icon: LuSparkles, badge: 'Smart' },
    { href: '/goals', label: 'Goals & Targets', icon: LuTarget, badge: null },
    { href: '/profile', label: 'Profile & Settings', icon: LuSettings, badge: null },
];

export default function DesktopSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`hidden md:flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-all duration-300 sticky top-0 h-screen z-40 select-none ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Header: Brand Logo & Collapse Toggle */}
            <div className={`p-4 border-b border-[var(--border-color)] ${collapsed ? 'flex flex-col items-center gap-2.5' : 'flex items-center justify-between'}`}>
                <Link href="/" className="flex items-center gap-3 overflow-hidden group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-md shadow-[var(--accent-glow)] shrink-0 transition-transform group-hover:scale-105">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 20A7 7 0 0 1 4 13c0-3.5 2.5-6.5 6-7 1.5 2.5 1.5 5.5 0 8" />
                            <path d="M13 4a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7-1.5-2.5-1.5-5.5 0-8" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 transition-opacity duration-200">
                            <h1 className="font-bold text-sm tracking-tight text-[var(--text-primary)] leading-tight truncate">
                                NutriSnap
                            </h1>
                            <p className="text-[10px] text-[var(--text-secondary)] font-normal truncate">
                                AI Health & Nutrition
                            </p>
                        </div>
                    )}
                </Link>

                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors nutri-press"
                    title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {collapsed ? <LuChevronRight className="text-xs" /> : <LuChevronLeft className="text-xs" />}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                    const isActive = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed ? label : undefined}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-180 nutri-press ${
                                isActive
                                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)]'
                            } ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                            <Icon
                                className={`text-base shrink-0 transition-transform duration-200 ${
                                    isActive ? 'text-[var(--accent-primary)] scale-110' : 'text-[var(--text-secondary)] group-hover:scale-105'
                                }`}
                            />

                            {!collapsed && (
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                    <span className="truncate">{label}</span>
                                    {badge && (
                                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                                            {badge}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Active Left Indicator Bar */}
                            {isActive && (
                                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--accent-primary)] rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Subtle Telemetry Indicator (when expanded) */}
            {!collapsed && (
                <div className="mx-3 my-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                        <span className="text-[11px] font-semibold text-[var(--text-primary)]">AI Telemetry</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                        Multimodal meal recognition & real-time macro telemetry active.
                    </p>
                </div>
            )}

            {/* Footer: User Account & Clean Stacked Theme Switcher */}
            <div className="p-3 border-t border-[var(--border-color)] space-y-2.5">
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <UserButton />
                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">My Account</p>
                                <p className="text-[10px] text-[var(--text-secondary)] truncate">NutriSnap Member</p>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <Link
                            href="/profile"
                            className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors shrink-0"
                            title="Profile & Settings"
                        >
                            <LuSettings className="text-xs" />
                        </Link>
                    )}
                </div>

                {/* Clean Theme Switcher Row (spans full width, no truncation) */}
                {!collapsed && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">Theme</span>
                        <ThemeSwitcher variant="dropdown" />
                    </div>
                )}
            </div>
        </aside>
    );
}
