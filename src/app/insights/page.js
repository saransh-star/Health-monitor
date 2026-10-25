'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfile, getDashboardStats, getWeeklyStats } from '../actions';
import ThemeSwitcher from '../components/ThemeSwitcher';
import AIInsightsCard from '../components/AIInsightsCard';
import Link from 'next/link';
import {
    LuSparkles,
    LuBrain,
    LuRefreshCw,
    LuArrowRight,
    LuCheck,
    LuInfo,
    LuLightbulb,
    LuHeart,
} from 'react-icons/lu';

export default function InsightsPage() {
    const [profile, setProfile] = useState(null);
    const [calories, setCalories] = useState(0);
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const [streak, setStreak] = useState(0);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const offset = new Date().getTimezoneOffset();
            const [p, stats, wStats] = await Promise.all([
                getProfile(),
                getDashboardStats(offset),
                getWeeklyStats(offset, 7),
            ]);
            setProfile(p);
            if (stats) {
                setCalories(stats.dailyMacros.calories);
                setMacros(stats.dailyMacros);
                setStreak(stats.streak || 0);
            }
            if (wStats) {
                setWeeklyStats(wStats);
            }
        } catch (e) {
            console.error('Failed to load insights data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const target = profile?.dailyCalorieTarget || 1800;
    const proteinTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.3) / 4) : 135;
    const carbsTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.4) / 4) : 180;
    const fatTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.25) / 9) : 50;
    const fiberTarget = 30;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        AI Health Insights
                    </h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                        Actionable, data-supported observations designed to build sustainable wellness habits.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors nutri-press shadow-xs"
                    >
                        <LuRefreshCw className={`text-xs ${loading ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <div className="hidden sm:block">
                        <ThemeSwitcher variant="dropdown" />
                    </div>
                </div>
            </div>

            {/* Core Insights Module */}
            <AIInsightsCard
                calories={calories}
                target={target}
                macros={macros}
                targets={{
                    protein: proteinTarget,
                    carbs: carbsTarget,
                    fat: fatTarget,
                    fiber: fiberTarget,
                }}
                streak={streak}
                weeklyStats={weeklyStats}
                profile={profile}
            />

            {/* Evidence-Based Wellness Guidance Cards */}
            <div className="space-y-3 pt-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Evidence-Based Nutrition Guidelines
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="nutri-card p-5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                            <LuLightbulb className="text-amber-400 text-sm" />
                            <span>Optimal Protein Pacing</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Distributing protein across 3–4 meals (approx 25–35g per sitting) maximizes muscle protein synthesis and minimizes mid-day cravings.
                        </p>
                    </div>

                    <div className="nutri-card p-5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                            <LuHeart className="text-emerald-400 text-sm" />
                            <span>The Power of Dietary Fiber</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Aim for 30g+ daily of diverse prebiotic fiber from legumes, oats, flax, and berries to nourish your microbiome and stabilize glucose curves.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
