'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LuDroplets,
    LuScale,
    LuFlame,
    LuPlus,
    LuTrendingDown,
    LuHeartPulse,
    LuArrowRight,
} from 'react-icons/lu';

export default function HealthVitalsCard({
    currentWeight = 0,
    goalWeight = 0,
    unit = 'kg',
    streak = 0,
    calories = 0,
    targetCalories = 1800,
}) {
    // Client-side hydration tracking (persistent in localStorage)
    const [waterIntake, setWaterIntake] = useState(1250); // Default reasonable hydration
    const waterGoal = 2500; // ml

    useEffect(() => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const saved = localStorage.getItem(`nutrisnap-water-${todayStr}`);
            if (saved !== null) {
                setWaterIntake(parseInt(saved, 10));
            }
        } catch (e) {}
    }, []);

    const addWater = (amount) => {
        setWaterIntake((prev) => {
            const next = prev + amount;
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                localStorage.setItem(`nutrisnap-water-${todayStr}`, next.toString());
            } catch (e) {}
            return next;
        });
    };

    const waterPct = Math.min(Math.round((waterIntake / waterGoal) * 100), 100);
    const weightDiff = (currentWeight > 0 && goalWeight > 0) ? (currentWeight - goalWeight).toFixed(1) : null;
    const calorieBuffer = Math.max(targetCalories - calories, 0);

    return (
        <section className="nutri-card p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                        <LuHeartPulse className="text-base" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                            Daily Health Vitals
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Hydration, weight goal & caloric pace
                        </p>
                    </div>
                </div>

                <Link
                    href="/profile"
                    className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                >
                    Edit Targets <LuArrowRight className="text-[10px]" />
                </Link>
            </div>

            {/* 3 Spacious Vitals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Hydration Tracker */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                            <LuDroplets className="text-sky-400 text-sm" />
                            <span>Hydration</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 tabular-nums">
                            {waterPct}%
                        </span>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                                {waterIntake.toLocaleString()}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                                / {waterGoal.toLocaleString()} ml
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-sky-500/15 overflow-hidden mt-2">
                            <div
                                className="h-full bg-sky-400 rounded-full transition-all duration-300"
                                style={{ width: `${waterPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => addWater(250)}
                            className="py-1.5 px-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors nutri-press"
                            title="Add 250ml glass of water"
                        >
                            <LuPlus className="text-[10px]" /> 250ml
                        </button>
                        <button
                            type="button"
                            onClick={() => addWater(500)}
                            className="py-1.5 px-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors nutri-press"
                            title="Add 500ml water bottle"
                        >
                            <LuPlus className="text-[10px]" /> 500ml
                        </button>
                    </div>
                </div>

                {/* 2. Weight Trajectory */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                            <LuScale className="text-emerald-400 text-sm" />
                            <span>Target Weight</span>
                        </div>
                        {weightDiff && parseFloat(weightDiff) > 0 ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 whitespace-nowrap inline-flex items-center gap-0.5">
                                <LuTrendingDown className="text-xs" /> {weightDiff} {unit} left
                            </span>
                        ) : (
                            <span className="text-[11px] text-[var(--text-muted)] font-medium">On Track</span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                                {currentWeight > 0 ? currentWeight : '75'}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                                {unit} current
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
                            {goalWeight > 0 ? `Target: ${goalWeight} ${unit}` : `Target: 70 ${unit}`}
                        </p>
                    </div>

                    <Link
                        href="/profile#weight"
                        className="py-1.5 px-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] text-center transition-colors nutri-press"
                    >
                        Log weigh-in
                    </Link>
                </div>

                {/* 3. Caloric Pace & Deficit */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                            <LuFlame className="text-orange-400 text-sm" />
                            <span>Pacing & Deficit</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 whitespace-nowrap">
                            {streak} day streak
                        </span>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight">
                                {calorieBuffer.toLocaleString()}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                                kcal buffer
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
                            {calorieBuffer > 0 ? 'Healthy room for evening meal' : 'Target reached today'}
                        </p>
                    </div>

                    <Link
                        href="/analytics"
                        className="py-1.5 px-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] text-center transition-colors nutri-press"
                    >
                        View 7-day trend
                    </Link>
                </div>
            </div>
        </section>
    );
}
