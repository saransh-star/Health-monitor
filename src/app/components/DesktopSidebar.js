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

export default function DesktopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-72 border-r border-dark-800 min-h-screen sticky top-0 p-6 glass-strong z-50">
            <div className="mb-10 px-4">
                <h1 className="text-2xl font-bold gradient-text pb-1">NutriSnap ✨</h1>
                <p className="text-xs text-dark-400 mt-1">AI Food Tracker</p>
            </div>
            <nav className="flex-1 space-y-3">
                {navItems.map(({ href, label, icon: Icon, activeIcon: ActiveIcon }) => {
                    const isActive = pathname === href;
                    const CurrentIcon = isActive ? ActiveIcon : Icon;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-primary-500/10 text-primary-400 font-semibold border border-primary-500/20'
                                : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
                                }`}
                        >
                            <CurrentIcon className={`text-2xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''}`} />
                            <span className="text-[15px] tracking-wide">{label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto pt-6 border-t border-dark-800/50">
                <div className="glass rounded-xl p-4 text-center">
                    <p className="text-xs text-dark-300 font-medium">Nutrition tracking powered by</p>
                    <p className="text-sm font-bold text-dark-50 mt-1">Google Gemini</p>
                </div>
            </div>
        </aside>
    );
}
