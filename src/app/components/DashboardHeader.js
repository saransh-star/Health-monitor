'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    LuFlame,
    LuCalendar,
    LuChevronLeft,
    LuChevronRight,
    LuBell,
    LuDroplets,
    LuUtensils,
    LuCamera,
    LuSparkles,
} from 'react-icons/lu';

export default function DashboardHeader({
    userName = '',
    streak = 0,
    selectedDateStr,
    onDateChange,
    calories = 0,
    target = 2000,
}) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Afternoon Hydration',
            desc: 'Hydration check: Log a glass of water to reach your 2,500 ml target.',
            time: '20m ago',
            read: false,
            icon: LuDroplets,
            color: 'text-sky-400',
        },
        {
            id: 2,
            title: 'Logging Streak',
            desc: `You have active logging ${streak > 0 ? `${streak} days in a row` : 'today'}! Keep it going.`,
            time: '2h ago',
            read: false,
            icon: LuFlame,
            color: 'text-orange-400',
        },
        {
            id: 3,
            title: 'Evening Calorie Budget',
            desc: `${Math.max(target - calories, 0)} kcal remaining for balanced evening dinner.`,
            time: '4h ago',
            read: true,
            icon: LuUtensils,
            color: 'text-emerald-400',
        },
    ]);

    const notifRef = useRef(null);

    // Close notifications on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Greeting determination
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Date calculations
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isToday = !selectedDateStr || selectedDateStr === todayStr;

    const displayDate = selectedDateStr ? new Date(selectedDateStr + 'T00:00:00') : today;
    const formattedDate = displayDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const handlePrevDay = () => {
        const current = new Date((selectedDateStr || todayStr) + 'T00:00:00');
        current.setDate(current.getDate() - 1);
        const prevStr = current.toISOString().split('T')[0];
        if (onDateChange) onDateChange(prevStr);
    };

    const handleNextDay = () => {
        const current = new Date((selectedDateStr || todayStr) + 'T00:00:00');
        current.setDate(current.getDate() + 1);
        const nextStr = current.toISOString().split('T')[0];
        if (nextStr <= todayStr && onDateChange) {
            onDateChange(nextStr);
        }
    };

    const handleJumpToToday = () => {
        if (onDateChange) onDateChange(todayStr);
    };

    const remainingKcal = Math.max(target - calories, 0);

    return (
        <header className="pb-3 md:pb-4 border-b border-[var(--border-color)]">
            {/* Desktop Header Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
                {/* Left Side: Greeting, Title, and Integrated Date Pill */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent-primary)]">
                            {getGreeting()}{userName ? `, ${userName}` : ''}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                            {isToday ? `${remainingKcal} kcal remaining today` : `Viewing ${formattedDate}`}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 pt-0.5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                            Your health at a glance
                        </h1>

                        {/* Integrated Date Navigation Pill */}
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                            <button
                                type="button"
                                onClick={handlePrevDay}
                                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)] transition-colors nutri-press"
                                title="Previous Day"
                                aria-label="Previous Day"
                            >
                                <LuChevronLeft className="text-xs" />
                            </button>

                            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-[var(--text-primary)] select-none">
                                <LuCalendar className="text-[var(--accent-primary)] text-xs" />
                                <span>{formattedDate}</span>
                                {isToday && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold">
                                        Today
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleNextDay}
                                disabled={isToday}
                                className={`p-1 rounded-lg transition-colors nutri-press ${
                                    isToday
                                        ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-elevated)]'
                                }`}
                                title="Next Day"
                                aria-label="Next Day"
                            >
                                <LuChevronRight className="text-xs" />
                            </button>
                        </div>

                        {!isToday && (
                            <button
                                type="button"
                                onClick={handleJumpToToday}
                                className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
                            >
                                Back to Today
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Streak, Quick Scan Action, Notification */}
                <div className="flex items-center gap-2.5 shrink-0">
                    {/* Streak Pill */}
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold shadow-xs"
                        title={`${streak} day consistent logging streak`}
                    >
                        <LuFlame className="text-orange-400 text-sm animate-pulse" />
                        <span className="text-[var(--text-primary)] tabular-nums">{streak}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                            day{streak !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Quick Scan Action Button */}
                    <Link
                        href="/scan"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity nutri-press"
                    >
                        <LuCamera className="text-xs" />
                        <span>Scan Meal</span>
                    </Link>

                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative w-8 h-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors nutri-press shadow-xs"
                            title="Notifications & Reminders"
                            aria-label="Notifications"
                        >
                            <LuBell className="text-sm" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-primary)] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-app)]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Panel */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl nutri-glass border border-[var(--border-color)] shadow-2xl z-50 animate-slide-up space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                                    <div className="flex items-center gap-1.5">
                                        <LuBell className="text-xs text-[var(--accent-primary)]" />
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">Reminders & Updates</span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={markAllRead}
                                            className="text-[10px] text-[var(--accent-primary)] hover:underline font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {notifications.map((n) => {
                                        const Icon = n.icon;
                                        return (
                                            <div
                                                key={n.id}
                                                className={`p-2.5 rounded-xl border transition-colors ${
                                                    n.read
                                                        ? 'border-transparent bg-transparent opacity-80'
                                                        : 'border-[var(--border-color)] bg-[var(--bg-card-elevated)]'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`p-1.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] ${n.color}`}>
                                                        <Icon className="text-sm" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{n.title}</p>
                                                            <span className="text-[9px] text-[var(--text-muted)] shrink-0">{n.time}</span>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                                                            {n.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Header Layout (< md): 2 Tight, Clean Rows */}
            <div className="flex md:hidden flex-col gap-2">
                {/* Row 1: Greeting + Status (Left) & Streak + Notifications (Right) */}
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-1">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--accent-primary)] truncate block">
                            {getGreeting()}{userName ? `, ${userName}` : ''}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate block">
                            {isToday ? `${remainingKcal} kcal left today` : formattedDate}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Streak Pill */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold">
                            <LuFlame className="text-orange-400 text-xs animate-pulse" />
                            <span className="text-[var(--text-primary)] tabular-nums">{streak}d</span>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative w-7 h-7 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors nutri-press shadow-xs"
                                title="Notifications"
                                aria-label="Notifications"
                            >
                                <LuBell className="text-xs" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-primary)] text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-app)]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Notification Panel */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl nutri-glass border border-[var(--border-color)] shadow-2xl z-50 animate-slide-up space-y-2">
                                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                                        <span className="text-xs font-semibold text-[var(--text-primary)]">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllRead}
                                                className="text-[10px] text-[var(--accent-primary)] hover:underline font-medium"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {notifications.map((n) => {
                                            const Icon = n.icon;
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`p-2 rounded-xl border transition-colors ${
                                                        n.read
                                                            ? 'border-transparent bg-transparent opacity-80'
                                                            : 'border-[var(--border-color)] bg-[var(--bg-card-elevated)]'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={`p-1 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] ${n.color}`}>
                                                            <Icon className="text-xs" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{n.title}</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)] leading-tight">{n.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Title & Date Switcher */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                    <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] truncate">
                        Health Overview
                    </h1>

                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs shrink-0">
                        <button
                            type="button"
                            onClick={handlePrevDay}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors nutri-press"
                            title="Previous Day"
                            aria-label="Previous Day"
                        >
                            <LuChevronLeft className="text-xs" />
                        </button>

                        <div className="flex items-center gap-1 px-1.5 text-xs font-semibold text-[var(--text-primary)] select-none">
                            <LuCalendar className="text-[var(--accent-primary)] text-xs" />
                            <span>{isToday ? 'Today' : formattedDate}</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextDay}
                            disabled={isToday}
                            className={`p-1 rounded-lg transition-colors nutri-press ${
                                isToday
                                    ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                            title="Next Day"
                            aria-label="Next Day"
                        >
                            <LuChevronRight className="text-xs" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
