'use client';

import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { UserButton } from '@clerk/nextjs';

export default function MobileTopBar() {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-2.5 flex items-center justify-between select-none">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-sm shadow-[var(--accent-glow)] shrink-0 transition-transform group-hover:scale-105">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 20A7 7 0 0 1 4 13c0-3.5 2.5-6.5 6-7 1.5 2.5 1.5 5.5 0 8" />
                        <path d="M13 4a7 7 0 0 1 7 7c0 3.5-2.5 6.5-6 7-1.5-2.5-1.5-5.5 0-8" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)] leading-tight">
                        NutriSnap
                    </span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-normal leading-none">
                        AI Health
                    </span>
                </div>
            </Link>

            {/* Quick Actions: Theme Switcher & User Avatar */}
            <div className="flex items-center gap-2">
                <ThemeSwitcher variant="dropdown" />
                <div className="w-7 h-7 flex items-center justify-center">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    );
}
