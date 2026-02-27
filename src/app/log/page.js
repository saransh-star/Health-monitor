'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllMeals, deleteMeal, getProfile, getWeeklyStats } from '../actions';
import NutritionCard from '../components/NutritionCard';
import WeeklyChart from '../components/WeeklyChart';
import AIInsight from '../components/AIInsight';
import { IoCalendarOutline, IoFastFoodOutline, IoFlameOutline } from 'react-icons/io5';

export default function LogPage() {
    const [view, setView] = useState('today');
    const [meals, setMeals] = useState([]);
    const [todayCalories, setTodayCalories] = useState(0);
    const [profile, setProfile] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [mounted, setMounted] = useState(false);

    const loadMeals = useCallback(async () => {
        try {
            const offset = new Date().getTimezoneOffset();
            const all = await getAllMeals();
            setProfile(await getProfile());
            setWeeklyStats(await getWeeklyStats(offset));

            // Client local "today"
            const now = new Date();
            now.setMinutes(now.getMinutes() - offset);
            const todayStr = now.toISOString().split('T')[0];

            const todayMeals = all.filter(m => {
                if (!m.timestamp) return false;
                const d = new Date(m.timestamp);
                d.setMinutes(d.getMinutes() - offset);
                return d.toISOString().split('T')[0] === todayStr;
            });

            setTodayCalories(todayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0));

            if (view === 'today') {
                setMeals(todayMeals);
            } else {
                setMeals(all.slice(0, 50));
            }
        } catch (e) {
            console.error('Failed to load meals', e);
        }
    }, [view]);

    useEffect(() => {
        loadMeals().finally(() => setMounted(true));
    }, [loadMeals]);

    const handleDelete = async (id) => {
        await deleteMeal(id);
        await loadMeals();
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }


    const mealsByDate = groupMealsByDate(meals);

    return (
        <div className="space-y-5 py-4 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-dark-50">Meal Log</h1>
                <p className="text-sm text-dark-400 mt-1">Track your daily nutrition intake</p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 glass rounded-xl p-1">
                {['today', 'all'].map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === v
                            ? 'gradient-primary text-white shadow-md'
                            : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        {v === 'today' ? "Today" : "All Time"}
                    </button>
                ))}
            </div>

            {/* AI Insights & Charts */}
            {view === 'all' && weeklyStats.length > 0 && (
                <div className="space-y-6 mt-4 mb-6">
                    <AIInsight weeklyStats={weeklyStats} profile={profile} />
                    <WeeklyChart
                        data={weeklyStats}
                        dailyCalorieTarget={profile?.dailyCalorieTarget || 2000}
                    />
                </div>
            )}

            {/* Today Summary */}
            {view === 'today' && (
                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                            <IoFlameOutline className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-dark-400">Today&apos;s Total</p>
                            <p className="text-xl font-bold gradient-text">{todayCalories} kcal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-dark-400">
                        <IoFastFoodOutline />
                        <span className="text-sm font-medium">{meals.length} meal{meals.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}

            {/* Meals List */}
            {meals.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto">
                        <IoFastFoodOutline className="text-dark-500 text-3xl" />
                    </div>
                    <div>
                        <p className="text-dark-300 font-medium">No meals logged</p>
                        <p className="text-dark-500 text-sm mt-1">
                            {view === 'today' ? 'Scan your first meal today!' : 'Start tracking your meals!'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(mealsByDate).map(([date, dateMeals]) => (
                        <div key={date} className="space-y-3">
                            {view === 'all' && (
                                <div className="flex items-center gap-2 text-dark-400 text-xs font-medium pt-2">
                                    <IoCalendarOutline />
                                    <span>{formatDate(date)}</span>
                                    <span className="text-dark-500">
                                        ({dateMeals.reduce((s, m) => s + (m.totalCalories || 0), 0)} kcal)
                                    </span>
                                </div>
                            )}
                            {dateMeals.map((meal) => (
                                <NutritionCard key={meal.id} meal={meal} onDelete={handleDelete} />
                            ))}
                        </div>
                    ))}
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
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}
