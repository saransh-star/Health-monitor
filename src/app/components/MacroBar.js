'use client';

export default function MacroBar({ label, value = 0, max = 100, unit = 'g', color = '#45D6A0' }) {
    const safeMax = max > 0 ? max : 1;
    const pct = Math.min(Math.round((value / safeMax) * 100), 100);

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)] font-medium">{label}</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {value} <span className="text-[10px] text-[var(--text-muted)] font-normal">/ {max} {unit}</span>
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
        </div>
    );
}
