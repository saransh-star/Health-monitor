'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWeeklyStats, getProfile, getWeightHistory } from '../actions';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../components/ThemeProvider';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    LuTrendingUp,
    LuActivity,
    LuFlame,
    LuCalendar,
    LuCheck,
    LuScale,
    LuSparkles,
} from 'react-icons/lu';

export default function AnalyticsPage() {
    const [range, setRange] = useState(7); // 7 | 30 | 90 days
    const [stats, setStats] = useState([]);
    const [profile, setProfile] = useState(null);
    const [weights, setWeights] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isDark } = useTheme();
    // SWR Instant Hydration
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem(`nutrisnap_analytics_${range}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.stats) setStats(parsed.stats);
                if (parsed.profile) setProfile(parsed.profile);
                if (parsed.weights) setWeights(parsed.weights);
                setLoading(false);
            }
        } catch (e) {}
    }, [range]);

    const loadAnalytics = useCallback(async () => {
        try {
            const offset = new Date().getTimezoneOffset();
            const [s, p, w] = await Promise.all([
                getWeeklyStats(offset, range),
                getProfile(),
                getWeightHistory(),
            ]);
            setStats(s || []);
            setProfile(p);
            setWeights(w || []);

            try {
                sessionStorage.setItem(`nutrisnap_analytics_${range}`, JSON.stringify({
                    stats: s || [],
                    profile: p,
                    weights: w || [],
                }));
            } catch (e) {}
        } catch (e) {
            console.error('Failed to load analytics:', e);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const target = profile?.dailyCalorieTarget || 1800;

    // Aggregates
    const activeDays = stats.filter((d) => d.calories > 0).length;
    const totalCalories = stats.reduce((acc, d) => acc + d.calories, 0);
    const avgCalories = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;
    const totalProtein = stats.reduce((acc, d) => acc + (d.protein || 0), 0);
    const totalCarbs = stats.reduce((acc, d) => acc + (d.carbs || 0), 0);
    const totalFat = stats.reduce((acc, d) => acc + (d.fat || 0), 0);
    const totalFiber = stats.reduce((acc, d) => acc + (d.fiber || 0), 0);

    const macroPieData = [
        { name: 'Protein', value: totalProtein, color: '#45D6A0' },
        { name: 'Carbohydrates', value: totalCarbs, color: '#6EA8FE' },
        { name: 'Healthy Fats', value: totalFat, color: '#FFBF69' },
        { name: 'Dietary Fiber', value: totalFiber, color: '#A78BFA' },
    ].filter((item) => item.value > 0);

    const goalMetDays = stats.filter((d) => d.calories >= target * 0.85 && d.calories <= target * 1.15).length;
    const consistencyRate = stats.length > 0 ? Math.round((activeDays / stats.length) * 100) : 0;

    // Theme color adjustments for charts
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#9AA7C7' : '#65748B';

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Health Analytics
                    </h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                        Interactive historical intake, macronutrient distribution, and habits over time.
                    </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    {/* Time Range Filter: 7, 30, 90 days */}
                    <div className="nutri-segmented flex-1 sm:flex-initial">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setRange(d)}
                                className={`nutri-segmented-item flex-1 sm:flex-initial ${range === d ? 'nutri-segmented-item-active' : ''}`}
                            >
                                {d} Days
                            </button>
                        ))}
                    </div>

                    <div className="hidden sm:block">
                        <ThemeSwitcher variant="dropdown" />
                    </div>
                </div>
            </div>

            {/* KPI Cards Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="nutri-card p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Avg Daily Energy
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[var(--text-primary)] tabular-nums">
                            {avgCalories.toLocaleString()}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">kcal</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                        Target: {target.toLocaleString()} kcal
                    </p>
                </div>

                <div className="nutri-card p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Logging Consistency
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[var(--accent-primary)] tabular-nums">
                            {consistencyRate}%
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                        {activeDays} of {stats.length} days recorded
                    </p>
                </div>

                <div className="nutri-card p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Goal Alignment
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[var(--color-success)] tabular-nums">
                            {goalMetDays}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">days on-target</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                        Within ±15% of calorie budget
                    </p>
                </div>

                <div className="nutri-card p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Total Protein Pace
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[#45D6A0] tabular-nums">
                            {activeDays > 0 ? Math.round(totalProtein / activeDays) : 0}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">g / day</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                        Target: {profile?.dailyCalorieTarget ? Math.round((profile.dailyCalorieTarget * 0.3) / 4) : 135}g
                    </p>
                </div>
            </div>

            {/* Chart 1: Daily Calorie Intake vs Target Line */}
            <section className="nutri-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                            Calorie Intake Trend
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Daily caloric volume with your target line ({target} kcal)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-[#FF6B50]" />
                            <span className="text-[var(--text-secondary)]">Intake</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="calorieAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF6B50" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#FF6B50" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="dateStr" stroke={textColor} fontSize={11} tickLine={false} />
                            <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: 'var(--border-color)',
                                    borderRadius: '0.75rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                }}
                                formatter={(val) => [`${val} kcal`, 'Calories']}
                            />
                            <Area
                                type="monotone"
                                dataKey="calories"
                                stroke="#FF6B50"
                                strokeWidth={2.5}
                                fill="url(#calorieAreaGrad)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Chart 2 & 3: Macronutrient Distribution & Protein Pace Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Macronutrient Proportions Donut (5 cols) */}
                <section className="lg:col-span-5 nutri-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                            Nutrient Distribution
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Cumulative macro proportions across selected period
                        </p>
                    </div>

                    <div className="h-56 w-full flex items-center justify-center">
                        {macroPieData.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)]">No macro data available yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={macroPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                    >
                                        {macroPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-color)',
                                            borderRadius: '0.75rem',
                                            color: 'var(--text-primary)',
                                            fontSize: '12px',
                                        }}
                                        formatter={(val) => [`${Math.round(val)} g`, 'Total']}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#45D6A0]" />
                            <span className="text-[var(--text-secondary)]">Protein: {Math.round(totalProtein)}g</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#6EA8FE]" />
                            <span className="text-[var(--text-secondary)]">Carbs: {Math.round(totalCarbs)}g</span>
                        </div>
                    </div>
                </section>

                {/* Right: Daily Protein Intake Bar Chart (7 cols) */}
                <section className="lg:col-span-7 nutri-card p-5 sm:p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                            Daily Protein Tracking
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Grams of protein consumed per day
                        </p>
                    </div>

                    <div className="h-56 sm:h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="dateStr" stroke={textColor} fontSize={11} tickLine={false} />
                                <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-color)',
                                        borderRadius: '0.75rem',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                    }}
                                    formatter={(val) => [`${val} g`, 'Protein']}
                                />
                                <Bar dataKey="protein" fill="#45D6A0" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </div>
    );
}
