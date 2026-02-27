'use client';

import { useState, useEffect } from 'react';
import CalorieRing from './components/CalorieRing';
import MacroBar from './components/MacroBar';
import NutritionCard from './components/NutritionCard';
import { getProfile, getDashboardStats } from './actions';
import { IoFlameOutline, IoTrendingDownOutline, IoSparklesOutline } from 'react-icons/io5';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [calories, setCalories] = useState(0);
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const [recentMeals, setRecentMeals] = useState([]);
    const [streak, setStreak] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const offset = new Date().getTimezoneOffset();
                const p = await getProfile();
                const stats = await getDashboardStats(offset);
                setProfile(p);
                if (stats) {
                    setCalories(stats.dailyMacros.calories);
                    setMacros(stats.dailyMacros);
                    setRecentMeals(stats.recentMeals);
                    setStreak(stats.streak);
                }
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setMounted(true);
            }
        }
        load();
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const target = profile?.dailyCalorieTarget || 1800;
    const greeting = getGreeting();

    return (
        <div className="space-y-6 py-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-dark-400 text-sm">{greeting}</p>
                    <h1 className="text-2xl font-bold text-dark-50">
                        {profile?.name || 'NutriSnap'} <span className="inline-block animate-pulse">✨</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
                        <IoFlameOutline className="text-orange-400" />
                        <span className="text-sm font-semibold text-dark-200">{streak}</span>
                        <span className="text-[10px] text-dark-400">day{streak !== 1 ? 's' : ''}</span>
                    </div>
                    <UserButton />
                </div>
            </div>

            {/* Calorie Ring */}
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
                <CalorieRing consumed={calories} target={target} size={180} />
                <p className="text-xs text-dark-400 mt-3">
                    {calories <= target
                        ? `Stay within ${target - calories} kcal to hit your goal`
                        : `You're ${calories - target} kcal over today's target`}
                </p>
            </div>

            {/* Macros */}
            <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <IoSparklesOutline className="text-primary-400" />
                    <h2 className="text-sm font-semibold text-dark-200">Today&apos;s Macros</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <MacroBar label="Protein" value={macros.protein} max={profile?.dailyCalorieTarget ? Math.round(profile.dailyCalorieTarget * 0.3 / 4) : 135} />
                    <MacroBar label="Carbs" value={macros.carbs} max={profile?.dailyCalorieTarget ? Math.round(profile.dailyCalorieTarget * 0.4 / 4) : 180} />
                    <MacroBar label="Fat" value={macros.fat} max={profile?.dailyCalorieTarget ? Math.round(profile.dailyCalorieTarget * 0.25 / 9) : 50} />
                    <MacroBar label="Fiber" value={macros.fiber} max={30} />
                </div>
            </div>

            {/* Quick Scan CTA */}
            <Link
                href="/scan"
                className="block gradient-primary rounded-2xl p-4 text-center transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]"
            >
                <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <IoTrendingDownOutline className="text-white text-xl" />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-semibold">Snap Your Meal</p>
                        <p className="text-white/70 text-xs">Take a photo to track calories instantly</p>
                    </div>
                </div>
            </Link>

            {/* Recent Meals */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-dark-200">Recent Meals</h2>
                    <Link href="/log" className="text-xs text-primary-400 hover:text-primary-300">
                        See all →
                    </Link>
                </div>
                {recentMeals.length === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center">
                        <p className="text-dark-400 text-sm">No meals logged today</p>
                        <p className="text-dark-500 text-xs mt-1">Scan your first meal to get started!</p>
                    </div>
                ) : (
                    recentMeals.map((meal) => (
                        <NutritionCard key={meal.id} meal={meal} showActions={false} />
                    ))
                )}
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}
