'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMealsForDate, getAllMeals, deleteMeal, getDailyCalories } from '../lib/storage';
import NutritionCard from '../components/NutritionCard';
import { IoCalendarOutline, IoFastFoodOutline, IoFlameOutline } from 'react-icons/io5';

export default function LogPage() {
    const [view, setView] = useState('today');
    const [meals, setMeals] = useState([]);
    const [mounted, setMounted] = useState(false);

    const loadMeals = useCallback(() => {
        if (view === 'today') {
            setMeals(getMealsForDate());
        } else {
            setMeals(getAllMeals().slice(0, 50));
        }
    }, [view]);

    useEffect(() => {
        loadMeals();
        setMounted(true);
    }, [loadMeals]);

    const handleDelete = (id) => {
        deleteMeal(id);
        loadMeals();
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const todayCalories = getDailyCalories();
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
    meals.forEach((m) => {
        const date = m.timestamp?.split('T')[0] || 'unknown';
        if (!groups[date]) groups[date] = [];
        groups[date].push(m);
    });
    return groups;
}

function formatDate(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}
