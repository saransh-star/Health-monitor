'use client';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-10 select-none">
            {/* Header Skeleton */}
            <div className="pb-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-3 bg-[var(--border-subtle)] rounded-full w-48" />
                    <div className="h-8 bg-[var(--border-subtle)] rounded-xl w-72" />
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-20 bg-[var(--border-subtle)] rounded-xl" />
                    <div className="h-9 w-28 bg-[var(--border-subtle)] rounded-xl" />
                    <div className="h-9 w-9 bg-[var(--border-subtle)] rounded-xl" />
                </div>
            </div>

            {/* Hero Row: Rings & Macros Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Concentric Rings Card Skeleton */}
                <div className="lg:col-span-5 nutri-card p-6 h-80 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-[var(--border-subtle)] rounded w-36" />
                        <div className="h-5 bg-[var(--border-subtle)] rounded-full w-20" />
                    </div>
                    <div className="w-44 h-44 rounded-full border-8 border-[var(--border-subtle)] mx-auto flex items-center justify-center">
                        <div className="h-6 w-20 bg-[var(--border-subtle)] rounded" />
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
                        <div className="h-3 w-24 bg-[var(--border-subtle)] rounded" />
                        <div className="h-3 w-28 bg-[var(--border-subtle)] rounded" />
                    </div>
                </div>

                {/* Macronutrient Balance Skeleton */}
                <div className="lg:col-span-7 nutri-card p-6 h-80 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-[var(--border-subtle)] rounded w-44" />
                        <div className="h-5 bg-[var(--border-subtle)] rounded-full w-24" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-2.5">
                                <div className="flex justify-between">
                                    <div className="h-3.5 w-16 bg-[var(--border-subtle)] rounded" />
                                    <div className="h-3.5 w-20 bg-[var(--border-subtle)] rounded" />
                                </div>
                                <div className="h-2 w-full bg-[var(--border-subtle)] rounded-full" />
                                <div className="h-3 w-32 bg-[var(--border-subtle)] rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Health Vitals Skeleton */}
            <div className="nutri-card p-6 space-y-4">
                <div className="h-4 bg-[var(--border-subtle)] rounded w-40" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] h-32 flex flex-col justify-between">
                            <div className="flex justify-between">
                                <div className="h-3.5 w-24 bg-[var(--border-subtle)] rounded" />
                                <div className="h-4 w-12 bg-[var(--border-subtle)] rounded-full" />
                            </div>
                            <div className="h-7 w-28 bg-[var(--border-subtle)] rounded" />
                            <div className="h-6 w-full bg-[var(--border-subtle)] rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Insights Skeleton */}
            <div className="nutri-card p-6 space-y-4">
                <div className="flex justify-between">
                    <div className="h-4 bg-[var(--border-subtle)] rounded w-52" />
                    <div className="h-7 w-28 bg-[var(--border-subtle)] rounded-xl" />
                </div>
                <div className="h-24 bg-[var(--bg-card-elevated)] rounded-2xl border border-[var(--border-color)]" />
            </div>
        </div>
    );
}
