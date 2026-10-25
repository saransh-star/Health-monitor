'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LuActivity,
    LuUtensils,
    LuCamera,
    LuTrendingUp,
    LuUser,
} from 'react-icons/lu';

const NAV_ITEMS = [
    { href: '/', label: 'Today', icon: LuActivity },
    { href: '/log', label: 'Diary', icon: LuUtensils },
    { href: '/scan', label: 'Scan', icon: LuCamera, isAction: true },
    { href: '/analytics', label: 'Trends', icon: LuTrendingUp },
    { href: '/profile', label: 'Profile', icon: LuUser },
];

export default function BottomNav() {
    const pathname = usePathname();

    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(8);
        }
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
            <div className="max-w-md mx-auto px-4 pb-2">
                <div className="pointer-events-auto nutri-glass border border-[var(--border-color)] rounded-3xl h-16 px-2 flex items-center justify-around shadow-2xl">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, isAction }) => {
                        const isActive = pathname === href;

                        if (isAction) {
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={triggerHaptic}
                                    className="relative -top-4 nutri-press group"
                                    aria-label="Scan food with AI"
                                >
                                    <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent-glow)] border-4 border-[var(--bg-app)] transition-transform group-hover:scale-105">
                                        <LuCamera className="text-2xl" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-[var(--accent-primary)] block text-center mt-0.5">
                                        Scan
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={triggerHaptic}
                                className={`relative flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition-all duration-200 nutri-press ${
                                    isActive
                                        ? 'text-[var(--accent-primary)] font-semibold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <Icon
                                    className={`text-xl transition-transform duration-200 ${
                                        isActive ? 'scale-110 text-[var(--accent-primary)]' : ''
                                    }`}
                                />
                                <span className="text-[10px] tracking-tight mt-0.5 truncate">{label}</span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-0.5" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
