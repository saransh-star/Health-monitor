'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoHomeOutline, IoHome, IoCameraOutline, IoCamera, IoListOutline, IoList, IoPersonOutline, IoPerson } from 'react-icons/io5';

const navItems = [
    { href: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
    { href: '/scan', label: 'Scan', icon: IoCameraOutline, activeIcon: IoCamera },
    { href: '/log', label: 'Log', icon: IoListOutline, activeIcon: IoList },
    { href: '/profile', label: 'Profile', icon: IoPersonOutline, activeIcon: IoPerson },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong pb-safe">
            <div className="max-w-lg mx-auto flex items-center justify-around h-16">
                {navItems.map(({ href, label, icon: Icon, activeIcon: ActiveIcon }) => {
                    const isActive = pathname === href;
                    const CurrentIcon = isActive ? ActiveIcon : Icon;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-0.5 w-16 py-2 rounded-xl transition-all duration-300 ${isActive
                                ? 'text-primary-400 scale-105'
                                : 'text-dark-400 hover:text-dark-200 active:scale-95'
                                }`}
                        >
                            <CurrentIcon className={`text-xl transition-all ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''}`} />
                            <span className={`text-[10px] font-medium ${isActive ? 'gradient-text' : ''}`}>{label}</span>
                            {isActive && (
                                <div className="absolute -bottom-0 w-8 h-0.5 gradient-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
