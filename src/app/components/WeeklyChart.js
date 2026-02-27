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

export default function WeeklyChart({ data, dailyCalorieTarget, dailyProteinTarget = 50 }) {
    if (!data || data.length === 0) return null;

    // Custom Tooltip for better aesthetics
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-800/90 backdrop-blur-md border border-dark-600 p-3 rounded-xl shadow-xl">
                    <p className="text-dark-50 font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">{entry.value}</span> {entry.name === 'Calories' ? 'kcal' : 'g'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass rounded-2xl p-4 space-y-4">
            <div>
                <h3 className="font-semibold text-dark-50">7-Day Trends</h3>
                <p className="text-xs text-dark-400">Calories & Protein vs. Targets</p>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D35" vertical={false} />
                        <XAxis
                            dataKey="dateStr"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2D2D35', opacity: 0.4 }} />
                        <ReferenceLine y={dailyCalorieTarget} stroke="#EF4444" strokeDasharray="3 3" opacity={0.5} />

                        <Bar
                            dataKey="calories"
                            name="Calories"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="protein"
                            name="Protein"
                            fill="#EC4899"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    <span className="text-dark-300">Calories</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-secondary-500"></div>
                    <span className="text-dark-300">Protein</span>
                </div>
            </div>
        </div>
    );
}
