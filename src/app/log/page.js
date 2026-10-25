'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllMeals, deleteMeal, saveMeal, getProfile } from '../actions';
import NutritionCard from '../components/NutritionCard';
import ThemeSwitcher from '../components/ThemeSwitcher';
import {
    LuCalendar,
    LuUtensils,
    LuPlus,
    LuFlame,
    LuSearch,
    LuX,
    LuClock,
    LuSparkles,
} from 'react-icons/lu';

export default function LogPage() {
    const [view, setView] = useState('today'); // 'today' | 'all'
    const [meals, setMeals] = useState([]);
    const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const [profile, setProfile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showManualModal, setShowManualModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Manual Meal Form State
    const [manualForm, setManualForm] = useState({
        name: '',
        portion: '1 serving',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        time: new Date().toISOString().slice(0, 16),
    });

    // SWR Instant Hydration
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('nutrisnap_meals_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.todayMeals) setMeals(parsed.todayMeals);
                if (parsed.todayTotals) setTodayTotals(parsed.todayTotals);
                if (parsed.profile) setProfile(parsed.profile);
            }
        } catch (e) {}
        finally {
            setMounted(true);
        }
    }, []);

    const loadMeals = useCallback(async () => {
        try {
            const offset = new Date().getTimezoneOffset();
            const [all, p] = await Promise.all([
                getAllMeals(),
                getProfile(),
            ]);

            setProfile(p);

            const now = new Date();
            now.setMinutes(now.getMinutes() - offset);
            const todayStr = now.toISOString().split('T')[0];

            const todayMeals = all.filter((m) => {
                if (!m.timestamp) return false;
                const d = new Date(m.timestamp);
                d.setMinutes(d.getMinutes() - offset);
                return d.toISOString().split('T')[0] === todayStr;
            });

            const totals = {
                calories: todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0),
                protein: Math.round(todayMeals.reduce((s, m) => s + (m.totalProtein || 0), 0) * 10) / 10,
                carbs: Math.round(todayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0) * 10) / 10,
                fat: Math.round(todayMeals.reduce((s, m) => s + (m.totalFat || 0), 0) * 10) / 10,
                fiber: Math.round(todayMeals.reduce((s, m) => s + (m.totalFiber || 0), 0) * 10) / 10,
            };

            setTodayTotals(totals);

            if (view === 'today') {
                setMeals(todayMeals);
            } else {
                setMeals(all.slice(0, 50));
            }

            try {
                sessionStorage.setItem('nutrisnap_meals_cache', JSON.stringify({
                    todayMeals,
                    todayTotals: totals,
                    profile: p,
                }));
            } catch (e) {}
        } catch (e) {
            console.error('Failed to load meals', e);
        } finally {
            setMounted(true);
        }
    }, [view]);

    useEffect(() => {
        loadMeals();
    }, [loadMeals]);

    const handleDelete = async (id) => {
        await deleteMeal(id);
        await loadMeals();
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualForm.name.trim()) return;

        const cal = parseInt(manualForm.calories, 10) || 0;
        const pro = parseFloat(manualForm.protein) || 0;
        const crb = parseFloat(manualForm.carbs) || 0;
        const ft = parseFloat(manualForm.fat) || 0;
        const fib = parseFloat(manualForm.fiber) || 0;

        const newMeal = {
            foods: [
                {
                    name: manualForm.name,
                    portion: manualForm.portion || '1 serving',
                    calories: cal,
                    protein: pro,
                    carbs: crb,
                    fat: ft,
                    fiber: fib,
                },
            ],
            totalCalories: cal,
            totalProtein: pro,
            totalCarbs: crb,
            totalFat: ft,
            totalFiber: fib,
            healthScore: 7,
            weightLossTip: 'Accurately logged manual meal.',
        };

        const isoTime = new Date(manualForm.time).toISOString();
        await saveMeal(newMeal, isoTime);

        setShowManualModal(false);
        setManualForm({
            name: '',
            portion: '1 serving',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            fiber: '',
            time: new Date().toISOString().slice(0, 16),
        });

        await loadMeals();
    };

    if (!mounted) {
        return (
            <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 bg-[var(--border-subtle)] rounded-xl w-48" />
                <div className="nutri-card p-6 h-36 bg-[var(--border-subtle)]/30" />
                <div className="space-y-3">
                    <div className="nutri-card p-6 h-28 bg-[var(--border-subtle)]/30" />
                    <div className="nutri-card p-6 h-28 bg-[var(--border-subtle)]/30" />
                </div>
            </div>
        );
    }

    const filteredMeals = meals.filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const foodNames = m.foods?.map((f) => f.name.toLowerCase()).join(' ') || '';
        return foodNames.includes(q);
    });

    const mealsByDate = groupMealsByDate(filteredMeals);

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Daily Food Diary
                    </h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                        Track, review, and adjust your complete meal timeline and nutritional totals.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowManualModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity nutri-press"
                    >
                        <LuPlus className="text-sm" />
                        <span>Quick Add</span>
                    </button>
                    <div className="hidden sm:block">
                        <ThemeSwitcher variant="dropdown" />
                    </div>
                </div>
            </div>

            {/* Segmented Timeline Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="nutri-segmented sm:w-72">
                    <button
                        type="button"
                        onClick={() => setView('today')}
                        className={`flex-1 nutri-segmented-item ${view === 'today' ? 'nutri-segmented-item-active' : ''}`}
                    >
                        Today&apos;s Diary
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('all')}
                        className={`flex-1 nutri-segmented-item ${view === 'all' ? 'nutri-segmented-item-active' : ''}`}
                    >
                        All History
                    </button>
                </div>

                <div className="relative sm:w-64">
                    <LuSearch className="absolute left-3 top-3 text-xs text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logged food items..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>
            </div>

            {/* Today's Daily Intake Summary Card */}
            {view === 'today' && (
                <section className="nutri-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-md shadow-[var(--accent-glow)]">
                                <LuFlame className="text-xl" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Today&apos;s Consumed Nutrients
                                </p>
                                <p className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
                                    {todayTotals.calories} <span className="text-xs font-normal text-[var(--text-secondary)]">kcal</span>
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--border-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                            {meals.length} meal{meals.length !== 1 ? 's' : ''} logged
                        </span>
                    </div>

                    {/* Macronutrient mini totals pill */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-color)] text-xs">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block">Protein</span>
                            <span className="text-sm font-bold text-[#45D6A0] tabular-nums">{todayTotals.protein}g</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block">Carbohydrates</span>
                            <span className="text-sm font-bold text-[#6EA8FE] tabular-nums">{todayTotals.carbs}g</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block">Fats</span>
                            <span className="text-sm font-bold text-[#FFBF69] tabular-nums">{todayTotals.fat}g</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                            <span className="text-[10px] text-[var(--text-secondary)] block">Dietary Fiber</span>
                            <span className="text-sm font-bold text-[#A78BFA] tabular-nums">{todayTotals.fiber}g</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Meals Timeline */}
            {filteredMeals.length === 0 ? (
                <div className="nutri-card p-12 text-center space-y-3">
                    <div className="w-14 h-14 bg-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto text-[var(--text-muted)]">
                        <LuUtensils className="text-2xl" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                            {searchQuery ? 'No matching meals found' : 'No meals recorded for this view'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {searchQuery
                                ? 'Try searching for a different ingredient.'
                                : 'Snap your meal or use Quick Add to record breakfast, lunch, or dinner.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(mealsByDate).map(([date, dateMeals]) => {
                        const dayCalories = dateMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);

                        return (
                            <div key={date} className="space-y-3">
                                {view === 'all' && (
                                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)] px-1 pt-2">
                                        <div className="flex items-center gap-2">
                                            <LuCalendar className="text-[var(--accent-primary)]" />
                                            <span>{formatDate(date)}</span>
                                        </div>
                                        <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                                            Total: <strong className="text-[var(--text-primary)]">{dayCalories} kcal</strong>
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {dateMeals.map((meal) => (
                                        <NutritionCard
                                            key={meal.id}
                                            meal={meal}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* QUICK ADD MANUAL MODAL */}
            {showManualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="nutri-card p-6 w-full max-w-lg space-y-4 shadow-2xl relative animate-slide-up">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                            <div className="flex items-center gap-2">
                                <LuPlus className="text-[var(--accent-primary)] text-lg" />
                                <h3 className="font-bold text-base text-[var(--text-primary)]">Quick Manual Entry</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowManualModal(false)}
                                className="p-1 rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-secondary)]"
                            >
                                <LuX className="text-base" />
                            </button>
                        </div>

                        <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-semibold text-[var(--text-primary)]">Meal / Food Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={manualForm.name}
                                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                                    placeholder="e.g. Scrambled eggs & whole wheat toast"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-[var(--text-primary)]">Portion Size</label>
                                    <input
                                        type="text"
                                        value={manualForm.portion}
                                        onChange={(e) => setManualForm({ ...manualForm, portion: e.target.value })}
                                        placeholder="e.g. 1 bowl (250g)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-[var(--text-primary)]">Calories (kcal) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={manualForm.calories}
                                        onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })}
                                        placeholder="350"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Protein (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualForm.protein}
                                        onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                                        placeholder="24"
                                        className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Carbs (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualForm.carbs}
                                        onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                                        placeholder="30"
                                        className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Fat (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualForm.fat}
                                        onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })}
                                        placeholder="12"
                                        className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Fiber (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualForm.fiber}
                                        onChange={(e) => setManualForm({ ...manualForm, fiber: e.target.value })}
                                        placeholder="4"
                                        className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-[var(--text-primary)]">Log Timestamp</label>
                                <input
                                    type="datetime-local"
                                    value={manualForm.time}
                                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-app)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold shadow-xs hover:opacity-95 transition-opacity"
                                >
                                    Save to Diary
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function groupMealsByDate(meals) {
    const groups = {};
    const offset = new Date().getTimezoneOffset();
    meals.forEach((m) => {
        let dateStr = 'unknown';
        if (m.timestamp) {
            const d = new Date(m.timestamp);
            d.setMinutes(d.getMinutes() - offset);
            dateStr = d.toISOString().split('T')[0];
        }
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(m);
    });
    return groups;
}

function formatDate(dateStr) {
    const offset = new Date().getTimezoneOffset();
    const today = new Date();
    today.setMinutes(today.getMinutes() - offset);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setMinutes(yesterday.getMinutes() - offset);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}
