'use client';

const MACRO_CONFIG = [
    {
        key: 'protein',
        label: 'Protein',
        color: '#45D6A0',
        bgTrack: 'rgba(69, 214, 160, 0.15)',
        unit: 'g',
    },
    {
        key: 'carbs',
        label: 'Carbs',
        color: '#6EA8FE',
        bgTrack: 'rgba(110, 168, 254, 0.15)',
        unit: 'g',
    },
    {
        key: 'fat',
        label: 'Fats',
        color: '#FFBF69',
        bgTrack: 'rgba(255, 191, 105, 0.15)',
        unit: 'g',
    },
    {
        key: 'fiber',
        label: 'Fiber',
        color: '#A78BFA',
        bgTrack: 'rgba(167, 139, 250, 0.15)',
        unit: 'g',
    },
];

export default function MacronutrientCard({
    protein = 0,
    proteinTarget = 135,
    carbs = 0,
    carbsTarget = 180,
    fat = 0,
    fatTarget = 50,
    fiber = 0,
    fiberTarget = 30,
    className = '',
}) {
    const values = {
        protein: { current: protein, target: proteinTarget },
        carbs: { current: carbs, target: carbsTarget },
        fat: { current: fat, target: fatTarget },
        fiber: { current: fiber, target: fiberTarget },
    };

    return (
        <section className={`nutri-card p-5 sm:p-6 space-y-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                        Macronutrient Balance
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Daily targets & consumption breakdown
                    </p>
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] px-2.5 py-1 rounded-full bg-[var(--border-subtle)] border border-[var(--border-color)]">
                    Target View
                </span>
            </div>

            {/* 4 Macro Bars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MACRO_CONFIG.map(({ key, label, color, bgTrack, unit }) => {
                    const data = values[key];
                    const safeTarget = data.target > 0 ? data.target : 1;
                    const pct = Math.min(Math.round((data.current / safeTarget) * 100), 100);
                    const remaining = Math.max(data.target - data.current, 0);

                    return (
                        <div
                            key={key}
                            className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2.5 transition-all hover:border-[var(--text-muted)]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shadow-xs"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                                        {label}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                                    {data.current} <span className="text-[10px] text-[var(--text-secondary)] font-normal">/ {data.target} {unit}</span>
                                </span>
                            </div>

                            {/* Slim Progress Bar */}
                            <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: bgTrack }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: color,
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-0.5">
                                <span>{pct}% of target</span>
                                <span className="font-semibold text-[var(--text-primary)] tabular-nums shrink-0 ml-1">
                                    {remaining > 0 ? `${remaining} ${unit} left` : 'Target reached ✓'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
