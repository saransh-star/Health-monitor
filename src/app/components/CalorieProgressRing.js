'use client';

export default function CalorieProgressRing({
    consumed = 0,
    target = 1800,
    size = 220,
    strokeWidth = 16,
}) {
    const safeTarget = target > 0 ? target : 1800;
    const remaining = Math.max(safeTarget - consumed, 0);
    const isOver = consumed > safeTarget;
    const percentage = Math.round((consumed / safeTarget) * 100);

    // Single Precision Calorie Wheel Geometry
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPercent = Math.min((consumed / safeTarget) * 100, 100);
    const offset = circumference - (clampedPercent / 100) * circumference;
    const center = size / 2;

    return (
        <div className="flex flex-col items-center select-none">
            {/* SVG Progress Wheel */}
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    className="-rotate-90"
                    role="img"
                    aria-label={`Calorie Ring: ${consumed} of ${safeTarget} kcal (${percentage}%). ${remaining} kcal left.`}
                >
                    <defs>
                        {/* Premium Gradient for Intake */}
                        <linearGradient id="calorieWheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            {isOver ? (
                                <>
                                    <stop offset="0%" stopColor="#EF4444" />
                                    <stop offset="100%" stopColor="#F87171" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#FF6B50" />
                                    <stop offset="50%" stopColor="#FF8F70" />
                                    <stop offset="100%" stopColor="#FFAA8A" />
                                </>
                            )}
                        </linearGradient>

                        {/* Subtle ambient drop shadow for the active arc */}
                        <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FF6B50" floodOpacity="0.35" />
                        </filter>
                    </defs>

                    {/* Background Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-[var(--border-subtle)]"
                        opacity={0.35}
                    />

                    {/* Active Progress Arc */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="url(#calorieWheelGrad)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        filter="url(#arcGlow)"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Central Caloric Reading */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">
                        Calories
                    </span>

                    <div className="flex items-baseline justify-center gap-1 my-0.5">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] tabular-nums">
                            {consumed.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            kcal
                        </span>
                    </div>

                    <span className="text-[11px] text-[var(--text-secondary)] font-normal">
                        of {safeTarget.toLocaleString()} kcal goal
                    </span>

                    <div className={`mt-2.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums ${
                        isOver
                            ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                            : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                    }`}>
                        {isOver ? `+${(consumed - safeTarget).toLocaleString()} kcal over` : `${remaining.toLocaleString()} kcal left`}
                    </div>
                </div>
            </div>

            {/* Clean, Non-Cluttered Footer Status */}
            <div className="flex items-center justify-between w-full pt-3 mt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                <span className="font-medium">
                    {percentage}% of daily budget
                </span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    Target: {safeTarget.toLocaleString()} kcal
                </span>
            </div>
        </div>
    );
}
