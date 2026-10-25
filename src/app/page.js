'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';
import CalorieProgressRing from './components/CalorieProgressRing';
import MacronutrientCard from './components/MacronutrientCard';
import HealthVitalsCard from './components/HealthVitalsCard';
import AIInsightsCard from './components/AIInsightsCard';
import NutritionCard from './components/NutritionCard';
import DashboardSkeleton from './components/DashboardSkeleton';
import { getDashboardBundle, deleteMeal } from './actions';
import Link from 'next/link';
import {
    LuUtensils,
    LuArrowRight,
    LuCamera,
    LuPlus,
} from 'react-icons/lu';

const CACHE_KEY = 'nutrisnap_dashboard_cache';

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [calories, setCalories] = useState(0);
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const [recentMeals, setRecentMeals] = useState([]);
    const [streak, setStreak] = useState(0);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);
    const [mounted, setMounted] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    // 1. SWR Instant Hydration from client session cache (0ms perceived load time)
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.profile) setProfile(parsed.profile);
                if (parsed.stats) {
                    setCalories(parsed.stats.dailyMacros.calories || 0);
                    setMacros(parsed.stats.dailyMacros || { protein: 0, carbs: 0, fat: 0, fiber: 0 });
                    setRecentMeals(parsed.stats.recentMeals || []);
                    setStreak(parsed.stats.streak || 0);
                }
                if (parsed.weeklyStats) setWeeklyStats(parsed.weeklyStats);
            }
        } catch (e) {
            console.warn('Cache read bypassed:', e);
        } finally {
            setMounted(true); // Always render UI immediately (0ms perceived time)!
        }
    }, []);

    // 2. High-performance single-roundtrip bundle fetching
    const loadData = useCallback(async (targetDate = null) => {
        try {
            setLoadingStats(true);
            const offset = new Date().getTimezoneOffset();
            const bundle = await getDashboardBundle(offset, targetDate);

            if (bundle) {
                if (bundle.profile) setProfile(bundle.profile);
                if (bundle.stats) {
                    setCalories(bundle.stats.dailyMacros.calories || 0);
                    setMacros(bundle.stats.dailyMacros || { protein: 0, carbs: 0, fat: 0, fiber: 0 });
                    setRecentMeals(bundle.stats.recentMeals || []);
                    setStreak(bundle.stats.streak || 0);
                }
                if (bundle.weeklyStats) {
                    setWeeklyStats(bundle.weeklyStats);
                }

                // Update SWR cache
                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
                } catch (e) {}
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoadingStats(false);
            setMounted(true);
        }
    }, []);

    useEffect(() => {
        loadData(selectedDateStr);
    }, [loadData, selectedDateStr]);

    const handleDateChange = (newDateStr) => {
        setSelectedDateStr(newDateStr);
    };

    const handleDeleteMeal = async (mealId) => {
        await deleteMeal(mealId);
        loadData(selectedDateStr);
    };

    // If initial cold visit without cache, render instant high-fidelity skeleton (no blank page!)
    if (!mounted) {
        return <DashboardSkeleton />;
    }

    const target = profile?.dailyCalorieTarget || 1800;
    const proteinTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.3) / 4) : 135;
    const carbsTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.4) / 4) : 180;
    const fatTarget = profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.25) / 9) : 50;
    const fiberTarget = 30;

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
            {/* 1. Cohesive Header with integrated date selector & actions */}
            <DashboardHeader
                userName={profile?.name || ''}
                streak={streak}
                selectedDateStr={selectedDateStr}
                onDateChange={handleDateChange}
                calories={calories}
                target={target}
            />

            {/* 2. Hero Nutrition Row: Concentric Rings & Macronutrient Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Card: Concentric Daily Energy Ring */}
                <div className="lg:col-span-5 flex flex-col">
                    <section className="nutri-card p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden">
                        <div className="w-full flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                                    Daily Nutrition Energy
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Caloric budget & burn progress
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                                {Math.round((calories / target) * 100)}% Target
                            </span>
                        </div>

                        <div className="my-auto py-2 flex items-center justify-center">
                            <CalorieProgressRing
                                consumed={calories}
                                target={target}
                                protein={macros.protein}
                                proteinTarget={proteinTarget}
                                carbs={macros.carbs}
                                carbsTarget={carbsTarget}
                                fat={macros.fat}
                                fatTarget={fatTarget}
                                fiber={macros.fiber}
                                fiberTarget={fiberTarget}
                                size={230}
                            />
                        </div>
                    </section>
                </div>

                {/* Right Card: Macronutrient Tracking Card */}
                <div className="lg:col-span-7 flex flex-col">
                    <MacronutrientCard
                        protein={macros.protein}
                        proteinTarget={proteinTarget}
                        carbs={macros.carbs}
                        carbsTarget={carbsTarget}
                        fat={macros.fat}
                        fatTarget={fatTarget}
                        fiber={macros.fiber}
                        fiberTarget={fiberTarget}
                        className="h-full flex flex-col justify-between"
                    />
                </div>
            </div>

            {/* 3. Daily Health Vitals Deck (Spacious 3-column row) */}
            <HealthVitalsCard
                currentWeight={profile?.currentWeight || 75}
                goalWeight={profile?.goalWeight || 70}
                unit={profile?.unit || 'kg'}
                streak={streak}
                calories={calories}
                targetCalories={target}
            />

            {/* 4. AI Nutrition Coach & Insight (Stored in LocalStorage, User-Triggered) */}
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

            {/* 5. Today's Meals Diary Timeline */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                            <LuUtensils className="text-sm" />
                        </div>
                        <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                            Today&apos;s Meals
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)] font-medium tabular-nums">
                            {recentMeals.length} logged
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/scan"
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 shadow-xs nutri-press"
                        >
                            <LuPlus className="text-xs text-[var(--accent-primary)]" /> Log Meal
                        </Link>
                        <Link
                            href="/log"
                            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                        >
                            Full Diary <LuArrowRight className="text-[10px]" />
                        </Link>
                    </div>
                </div>

                {recentMeals.length === 0 ? (
                    <div className="nutri-card p-8 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                            <LuUtensils className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                No meals logged for this day
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                                Use the scanner or log manually to record your nutrition.
                            </p>
                        </div>
                        <Link
                            href="/scan"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity nutri-press"
                        >
                            <LuCamera className="text-sm" />
                            <span>Scan first meal</span>
                        </Link>
                    </div>
                ) : (
                    <div className={recentMeals.length > 1 ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-3"}>
                        {recentMeals.map((meal) => (
                            <NutritionCard
                                key={meal.id}
                                meal={meal}
                                showActions={true}
                                onDelete={handleDeleteMeal}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
