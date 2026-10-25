'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

export default function WeeklyChart({ data, dailyCalorieTarget = 1800 }) {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="nutri-glass p-3 rounded-xl border border-[var(--border-color)] shadow-xl text-xs space-y-1">
                    <p className="font-bold text-[var(--text-primary)]">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="flex items-center justify-between gap-3">
                            <span className="text-[var(--text-secondary)]">{entry.name}:</span>
                            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
                                {entry.value} {entry.name === 'Calories' ? 'kcal' : 'g'}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="nutri-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)] tracking-tight">7-Day Intake Comparison</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">Calories & Protein Progression</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B50]" />
                        <span className="text-[var(--text-secondary)]">Calories</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#45D6A0]" />
                        <span className="text-[var(--text-secondary)]">Protein</span>
                    </div>
                </div>
            </div>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        barGap={4}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                        <XAxis
                            dataKey="dateStr"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={dailyCalorieTarget}
                            stroke="var(--accent-primary)"
                            strokeDasharray="4 4"
                            opacity={0.7}
                            label={{ value: 'Target', position: 'top', fill: 'var(--accent-primary)', fontSize: 10 }}
                        />
                        <Bar
                            dataKey="calories"
                            name="Calories"
                            fill="#FF6B50"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                        <Bar
                            dataKey="protein"
                            name="Protein"
                            fill="#45D6A0"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
