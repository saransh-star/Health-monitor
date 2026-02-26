'use client';

export default function CalorieRing({ consumed, target, size = 160, strokeWidth = 12 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min((consumed / (target || 1)) * 100, 100);
    const offset = circumference - (percent / 100) * circumference;
    const remaining = Math.max(target - consumed, 0);
    const isOver = consumed > target;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-dark-800"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#ringGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    style={{ '--ring-circumference': circumference }}
                />
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isOver ? '#ef4444' : '#10b981'} />
                        <stop offset="100%" stopColor={isOver ? '#f59e0b' : '#14b8a6'} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${isOver ? 'text-danger' : 'gradient-text'}`}>
                    {consumed}
                </span>
                <span className="text-[10px] text-dark-400 uppercase tracking-wider mt-0.5">
                    of {target} kcal
                </span>
                <span className={`text-xs font-medium mt-1 ${isOver ? 'text-danger' : 'text-primary-400'}`}>
                    {isOver ? `+${consumed - target} over` : `${remaining} left`}
                </span>
            </div>
        </div>
    );
}
