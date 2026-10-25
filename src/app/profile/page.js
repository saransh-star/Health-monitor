'use client';

import { useState, useEffect } from 'react';
import { getProfile, saveProfile, getWeightHistory, saveWeight, deleteWeight, getAllMeals } from '../actions';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { UserButton, useUser } from '@clerk/nextjs';
import {
    LuUser,
    LuPalette,
    LuUtensils,
    LuBell,
    LuShield,
    LuScale,
    LuPlus,
    LuTrash2,
    LuSave,
    LuCheck,
    LuDownload,
    LuActivity,
} from 'react-icons/lu';

const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, little to no exercise (x1.2)' },
    { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week (x1.375)' },
    { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week (x1.55)' },
    { value: 'active', label: 'Very Active', desc: 'Heavy exercise 6–7 days/week (x1.725)' },
    { value: 'very-active', label: 'Athlete Level', desc: 'Intense training / physical labor (x1.9)' },
];

const DIETARY_OPTIONS = [
    'Indian Vegetarian',
    'Vegan / Plant-Based',
    'Mediterranean',
    'High-Protein Fitness',
    'Low-Carb / Keto',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
];

export default function ProfilePage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('profile'); // profile | appearance | nutrition | notifications | privacy
    const [profile, setProfile] = useState(null);
    const [weights, setWeights] = useState([]);
    const [newWeight, setNewWeight] = useState('');
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dietaryPrefs, setDietaryPrefs] = useState(['Indian Vegetarian']);

    // Notifications state
    const [mealReminders, setMealReminders] = useState(true);
    const [hydrationReminders, setHydrationReminders] = useState(true);
    const [goalProgressAlerts, setGoalProgressAlerts] = useState(true);

    // SWR Instant Hydration
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('nutrisnap_profile_cache');
            if (cached) {
                setProfile(JSON.parse(cached));
                setMounted(true);
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const [p, w] = await Promise.all([
                    getProfile(),
                    getWeightHistory(),
                ]);
                const loadedProfile = p || {
                    name: user?.firstName || '',
                    dailyCalorieTarget: 1800,
                    currentWeight: 75,
                    goalWeight: 70,
                    height: 175,
                    activityLevel: 'moderate',
                    unit: 'kg',
                };
                setProfile(loadedProfile);
                setWeights(w || []);

                try {
                    sessionStorage.setItem('nutrisnap_profile_cache', JSON.stringify(loadedProfile));
                } catch (e) {}
            } catch (e) {
                console.error('Failed to load profile:', e);
            } finally {
                setMounted(true);
            }
        }
        load();
    }, [user]);

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        await saveProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!newWeight || isNaN(parseFloat(newWeight))) return;
        const offset = new Date().getTimezoneOffset();
        await saveWeight({ weight: parseFloat(newWeight), timezoneOffset: offset });
        setWeights(await getWeightHistory());
        const updatedProfile = { ...profile, currentWeight: parseFloat(newWeight) };
        setProfile(updatedProfile);
        await saveProfile(updatedProfile);
        setNewWeight('');
    };

    const handleDeleteWeight = async (id) => {
        await deleteWeight(id);
        setWeights(await getWeightHistory());
    };

    const exportUserData = async () => {
        const meals = await getAllMeals();
        const exportObj = {
            exportDate: new Date().toISOString(),
            profile,
            weights,
            meals,
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nutrisnap-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleDietaryPref = (pref) => {
        setDietaryPrefs((prev) =>
            prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
        );
    };

    if (!mounted || !profile) {
        return (
            <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="nutri-card p-6 h-32 bg-[var(--border-subtle)]/30" />
                <div className="nutri-card p-6 h-64 bg-[var(--border-subtle)]/30" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header with User Info */}
            <div className="nutri-card p-4 sm:p-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0 scale-110 ml-1">
                        <UserButton />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] truncate">
                            {profile.name || user?.fullName || 'Health Companion User'}
                        </h1>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                            {user?.primaryEmailAddress?.emailAddress || 'Personal account preferences'}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:block shrink-0">
                    <ThemeSwitcher variant="dropdown" />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="nutri-segmented overflow-x-auto">
                {[
                    { id: 'profile', label: 'Body & Profile', icon: LuUser },
                    { id: 'appearance', label: 'Themes & UI', icon: LuPalette },
                    { id: 'nutrition', label: 'Dietary Preferences', icon: LuUtensils },
                    { id: 'notifications', label: 'Reminders', icon: LuBell },
                    { id: 'privacy', label: 'Privacy & Export', icon: LuShield },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={`nutri-segmented-item flex items-center justify-center gap-2 whitespace-nowrap ${
                            activeTab === id ? 'nutri-segmented-item-active' : ''
                        }`}
                    >
                        <Icon className="text-xs" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* TAB 1: PROFILE & BODY METRICS */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <form onSubmit={handleSaveProfile} className="nutri-card p-6 space-y-4">
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Personal Details & Activity
                        </h2>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-semibold text-[var(--text-primary)]">Display Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="Enter your name"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-[var(--text-primary)]">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={profile.height}
                                        onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                                        placeholder="175"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-semibold text-[var(--text-primary)]">Current Weight ({profile.unit})</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={profile.currentWeight}
                                        onChange={(e) => setProfile({ ...profile, currentWeight: parseFloat(e.target.value) || 0 })}
                                        placeholder="75.0"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-semibold text-[var(--text-primary)]">Unit System</label>
                                    <select
                                        value={profile.unit}
                                        onChange={(e) => setProfile({ ...profile, unit: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    >
                                        <option value="kg">Metric (kg / cm)</option>
                                        <option value="lbs">Imperial (lbs / inches)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1 pt-1">
                                <label className="font-semibold text-[var(--text-primary)]">Activity Level</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {ACTIVITY_LEVELS.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setProfile({ ...profile, activityLevel: level.value })}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                profile.activityLevel === level.value
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)] font-semibold'
                                                    : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                                            }`}
                                        >
                                            <p className="font-semibold">{level.label}</p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{level.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity inline-flex items-center gap-1.5"
                            >
                                {saved ? <LuCheck /> : <LuSave />}
                                <span>{saved ? 'Changes Saved' : 'Save Profile'}</span>
                            </button>
                        </div>
                    </form>

                    {/* Weight Log Section */}
                    <section id="weight" className="nutri-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LuScale className="text-emerald-400 text-lg" />
                                <h3 className="font-bold text-base text-[var(--text-primary)]">
                                    Weigh-in History ({weights.length})
                                </h3>
                            </div>
                        </div>

                        {/* Add weigh in */}
                        <form onSubmit={handleAddWeight} className="flex gap-2">
                            <input
                                type="number"
                                step="0.1"
                                placeholder={`Enter weigh-in (${profile.unit})`}
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity inline-flex items-center gap-1"
                            >
                                <LuPlus /> Log Weight
                            </button>
                        </form>

                        {/* Recent weighs table */}
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                            {weights.map((w) => (
                                <div
                                    key={w.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]"
                                >
                                    <span className="font-medium text-[var(--text-primary)]">{w.date || 'Today'}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-[var(--text-primary)] tabular-nums">
                                            {w.weight} {profile.unit}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteWeight(w.id)}
                                            className="text-[var(--text-muted)] hover:text-red-400 p-0.5"
                                        >
                                            <LuTrash2 className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 2: APPEARANCE & THEMES */}
            {activeTab === 'appearance' && (
                <div className="space-y-6">
                    <section className="nutri-card p-6 space-y-4">
                        <div>
                            <h2 className="text-base font-bold text-[var(--text-primary)]">
                                Six Production Visual Themes
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Every theme adapts backgrounds, surface hierarchy, and accents while preserving identical layout logic and accessibility.
                            </p>
                        </div>

                        {/* Grid of 6 Themes */}
                        <ThemeSwitcher variant="grid" />
                    </section>
                </div>
            )}

            {/* TAB 3: DIETARY PREFERENCES */}
            {activeTab === 'nutrition' && (
                <div className="nutri-card p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Dietary & Ingredient Preferences
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Informs Gemini Vision and coaching tips when suggesting food alternatives.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        {DIETARY_OPTIONS.map((opt) => {
                            const isSelected = dietaryPrefs.includes(opt);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggleDietaryPref(opt)}
                                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                                        isSelected
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold'
                                            : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold">{opt}</span>
                                        {isSelected && <LuCheck className="text-xs" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: NOTIFICATIONS & REMINDERS */}
            {activeTab === 'notifications' && (
                <div className="nutri-card p-6 space-y-5">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Wellness Reminders & Alerts
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Keep nutrition logging gentle, consistent, and supportive.
                        </p>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">Mealtime Reminders</p>
                                <p className="text-[11px] text-[var(--text-secondary)]">Supportive nudge after usual breakfast, lunch, and dinner times</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={mealReminders}
                                onChange={(e) => setMealReminders(e.target.checked)}
                                className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">Hydration Check-ins</p>
                                <p className="text-[11px] text-[var(--text-secondary)]">Reminders throughout the day to meet your 2,500ml daily target</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={hydrationReminders}
                                onChange={(e) => setHydrationReminders(e.target.checked)}
                                className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">Streak & Milestone Celebrations</p>
                                <p className="text-[11px] text-[var(--text-secondary)]">Encouraging toast notifications on completing daily logging</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={goalProgressAlerts}
                                onChange={(e) => setGoalProgressAlerts(e.target.checked)}
                                className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: PRIVACY & DATA EXPORT */}
            {activeTab === 'privacy' && (
                <div className="nutri-card p-6 space-y-5">
                    <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">
                            Data Portability & Privacy
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            You retain complete ownership of your health records, food logs, and weigh-ins.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] space-y-2 text-xs text-[var(--text-secondary)]">
                        <p className="leading-relaxed">
                            All meal logs, weights, and profile information are stored in your secure PostgreSQL database via Neon Serverless. Multimodal food recognition uses Google Gemini Vision over encrypted HTTPS.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={exportUserData}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity nutri-press"
                        >
                            <LuDownload className="text-sm" />
                            <span>Export All Nutrition Records (JSON)</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
