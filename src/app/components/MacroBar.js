'use client';

const macroColors = {
    protein: { bar: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
    carbs: { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
    fat: { bar: 'bg-rose-500', text: 'text-rose-400', glow: 'shadow-rose-500/30' },
    fiber: { bar: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
};

export default function MacroBar({ label, value, unit = 'g', max = 100 }) {
    const key = label.toLowerCase();
    const colors = macroColors[key] || macroColors.protein;
    const percent = Math.min((value / (max || 1)) * 100, 100);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className={`font-medium capitalize ${colors.text}`}>{label}</span>
                <span className="text-dark-300 font-mono">
                    {Math.round(value)}{unit}
                </span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-700 ease-out shadow-md ${colors.glow}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
