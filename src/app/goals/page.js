'use client';

import { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '../actions';
import ThemeSwitcher from '../components/ThemeSwitcher';
import {
    LuTarget,
    LuFlame,
    LuScale,
    LuDroplets,
    LuCheck,
    LuInfo,
    LuSave,
} from 'react-icons/lu';

export default function GoalsPage() {
    const [profile, setProfile] = useState(null);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Goal configuration fields
    const [calories, setCalories] = useState(1800);
    const [protein, setProtein] = useState(135);
    const [carbs, setCarbs] = useState(180);
    const [fat, setFat] = useState(50);
    const [fiber, setFiber] = useState(30);
    const [hydration, setHydration] = useState(2500);
    const [goalWeight, setGoalWeight] = useState(70);
    const [unit, setUnit] = useState('kg');

    // SWR Instant Hydration
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('nutrisnap_profile_cache');
            if (cached) {
                const p = JSON.parse(cached);
                setProfile(p);
                const baseCal = p.dailyCalorieTarget || 1800;
                setCalories(baseCal);
                setGoalWeight(p.goalWeight || 70);
                setUnit(p.unit || 'kg');
                setProtein(Math.round((baseCal * 0.3) / 4));
                setCarbs(Math.round((baseCal * 0.4) / 4));
                setFat(Math.round((baseCal * 0.25) / 9));
                setMounted(true);
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const p = await getProfile();
                if (p) {
                    setProfile(p);
                    setCalories(p.dailyCalorieTarget || 1800);
                    setGoalWeight(p.goalWeight || 70);
                    setUnit(p.unit || 'kg');

                    const baseCal = p.dailyCalorieTarget || 1800;
                    setProtein(Math.round((baseCal * 0.3) / 4));
                    setCarbs(Math.round((baseCal * 0.4) / 4));
                    setFat(Math.round((baseCal * 0.25) / 9));

                    try {
                        sessionStorage.setItem('nutrisnap_profile_cache', JSON.stringify(p));
                    } catch (e) {}
                }
            } catch (e) {
                console.error('Failed to load profile for goals:', e);
            } finally {
                setMounted(true);
            }
        }
        load();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        const updated = {
            ...profile,
            dailyCalorieTarget: parseInt(calories, 10) || 1800,
            goalWeight: parseFloat(goalWeight) || 0,
            unit,
        };

        await saveProfile(updated);
        setProfile(updated);
        try {
            sessionStorage.setItem('nutrisnap_profile_cache', JSON.stringify(updated));
            sessionStorage.removeItem('nutrisnap_dashboard_cache'); // Invalidate stale dashboard cache
        } catch (err) {}
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // Calculate macro calorie sum and percentage
    const computedCal = protein * 4 + carbs * 4 + fat * 9;

    if (!mounted) {
        return (
            <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 bg-[var(--border-subtle)] rounded-xl w-56" />
                <div className="nutri-card p-6 h-40 bg-[var(--border-subtle)]/30" />
                <div className="nutri-card p-6 h-56 bg-[var(--border-subtle)]/30" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Goals & Targets
                    </h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                        Customize your daily energy budget, macronutrient proportions, hydration, and target weight.
                    </p>
                </div>

                <div className="hidden sm:block">
                    <ThemeSwitcher variant="dropdown" />
                </div>
            </div>

            {/* Disclaimer notice */}
            <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
                <LuInfo className="text-[var(--accent-primary)] text-base shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    User-configured targets are personal estimates for self-tracking. They do not constitute prescribed medical or clinical nutritional therapy. Consult a registered dietitian for tailored medical advice.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. Daily Calorie Budget */}
                <section className="nutri-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                                <LuFlame className="text-lg" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[var(--text-primary)]">
                                    Daily Calorie Target
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Base daily energy allowance for weight maintenance or fat loss
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min={1000}
                                max={5000}
                                step={50}
                                value={calories}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1800;
                                    setCalories(val);
                                    setProtein(Math.round((val * 0.3) / 4));
                                    setCarbs(Math.round((val * 0.4) / 4));
                                    setFat(Math.round((val * 0.25) / 9));
                                }}
                                className="w-28 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                            />
                            <span className="text-xs font-medium text-[var(--text-secondary)]">kcal</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <input
                            type="range"
                            min={1200}
                            max={3500}
                            step={50}
                            value={calories}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCalories(val);
                                setProtein(Math.round((val * 0.3) / 4));
                                setCarbs(Math.round((val * 0.4) / 4));
                                setFat(Math.round((val * 0.25) / 9));
                            }}
                            className="w-full accent-[var(--accent-primary)] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                            <span>1,200 kcal</span>
                            <span>1,800 kcal (Typical deficit)</span>
                            <span>2,400 kcal</span>
                            <span>3,500 kcal</span>
                        </div>
                    </div>
                </section>

                {/* 2. Macronutrient Target Distribution */}
                <section className="nutri-card p-6 space-y-5">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Macronutrient Split
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Fine-tune your daily grams of Protein, Carbohydrates, Fat, and Fiber.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Protein */}
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#45D6A0]">Protein</span>
                                <span className="text-[10px] text-[var(--text-muted)]">30% ratio</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    value={protein}
                                    onChange={(e) => setProtein(parseInt(e.target.value, 10) || 0)}
                                    className="w-20 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:border-[#45D6A0]"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">g</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)]">{protein * 4} kcal</p>
                        </div>

                        {/* Carbs */}
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#6EA8FE]">Carbohydrates</span>
                                <span className="text-[10px] text-[var(--text-muted)]">40% ratio</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    value={carbs}
                                    onChange={(e) => setCarbs(parseInt(e.target.value, 10) || 0)}
                                    className="w-20 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:border-[#6EA8FE]"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">g</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)]">{carbs * 4} kcal</p>
                        </div>

                        {/* Fat */}
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#FFBF69]">Healthy Fats</span>
                                <span className="text-[10px] text-[var(--text-muted)]">25% ratio</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    value={fat}
                                    onChange={(e) => setFat(parseInt(e.target.value, 10) || 0)}
                                    className="w-20 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:border-[#FFBF69]"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">g</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)]">{fat * 9} kcal</p>
                        </div>

                        {/* Fiber */}
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#A78BFA]">Dietary Fiber</span>
                                <span className="text-[10px] text-[var(--text-muted)]">Essential</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    value={fiber}
                                    onChange={(e) => setFiber(parseInt(e.target.value, 10) || 0)}
                                    className="w-20 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:border-[#A78BFA]"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">g</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)]">Target 30g+</p>
                        </div>
                    </div>
                </section>

                {/* 3. Weight & Hydration Targets */}
                <section className="nutri-card p-6 space-y-4">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                        Body Metrics & Hydration Goals
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                                <LuScale className="text-emerald-400 text-sm" />
                                <span>Target Goal Weight</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={goalWeight}
                                    onChange={(e) => setGoalWeight(e.target.value)}
                                    placeholder="68.0"
                                    className="w-24 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                                />
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)]"
                                >
                                    <option value="kg">kg</option>
                                    <option value="lbs">lbs</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                                <LuDroplets className="text-sky-400 text-sm" />
                                <span>Daily Water Target</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input
                                    type="number"
                                    step="100"
                                    value={hydration}
                                    onChange={(e) => setHydration(parseInt(e.target.value, 10) || 2500)}
                                    className="w-28 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-base font-bold text-[var(--text-primary)] text-right focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                                />
                                <span className="text-xs text-[var(--text-secondary)]">ml / day</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-sm shadow-md shadow-[var(--accent-glow)] flex items-center gap-2 hover:opacity-95 transition-opacity nutri-press"
                    >
                        {saved ? (
                            <>
                                <LuCheck className="text-base" />
                                <span>Goals Saved Successfully!</span>
                            </>
                        ) : (
                            <>
                                <LuSave className="text-base" />
                                <span>Save Nutrition Goals</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
