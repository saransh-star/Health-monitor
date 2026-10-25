'use client';

import { useState, useEffect } from 'react';
import { LuSparkles, LuCircleAlert, LuRefreshCw, LuShieldCheck, LuClock } from 'react-icons/lu';

const STORAGE_KEY = 'nutrisnap_last_ai_insight';

export default function AIInsight({ weeklyStats, profile }) {
    const [insight, setInsight] = useState('');
    const [updatedAt, setUpdatedAt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load saved insight on mount only - do NOT auto-fetch
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.insight) {
                    setInsight(parsed.insight);
                    setUpdatedAt(parsed.updatedAt || 'Saved recently');
                }
            }
        } catch (e) {
            console.error('Failed to read saved insight:', e);
        }
    }, []);

    const generateInsight = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/get-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weeklyStats, profile }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const newInsight = data.insight;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const formatted = `${dateStr}, ${timeStr}`;

            setInsight(newInsight);
            setUpdatedAt(formatted);

            // Persist to localStorage
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    insight: newInsight,
                    updatedAt: formatted,
                    timestamp: Date.now(),
                })
            );
        } catch (err) {
            setError(err.message || 'Failed to generate insight');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nutri-card p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 flex items-center justify-center text-[var(--accent-primary)] text-base">
                        <LuSparkles />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[var(--text-primary)] tracking-tight text-sm">
                                AI Nutrition Coach
                            </h3>
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                                Stored
                            </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)]">Weekly intake synthesis • Updates on request</p>
                    </div>
                </div>

                {updatedAt && (
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <LuClock className="text-[9px]" /> {updatedAt}
                    </span>
                )}
            </div>

            {!insight && !loading && (
                <div className="text-center py-2 space-y-3">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Receive personalized coaching observations generated from your recent nutrition data. We will save your insight and only update when you request.
                    </p>
                    <button
                        type="button"
                        onClick={generateInsight}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-xs shadow-md shadow-[var(--accent-glow)] flex items-center justify-center gap-2 nutri-press"
                    >
                        <LuSparkles className="text-sm" /> Generate AI Coach Insight
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-color)] animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 animate-spin" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-2.5 bg-[var(--border-subtle)] rounded w-3/4" />
                        <div className="h-2.5 bg-[var(--border-subtle)] rounded w-1/2" />
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-xl p-3 text-center">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-error)]/20 mb-1 text-[var(--color-error)]">
                        <LuCircleAlert className="text-base" />
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-error)]">Insight Not Available</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{error}</p>
                </div>
            )}

            {insight && !loading && (
                <div className="space-y-2.5">
                    <div className="p-3.5 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl">
                        <p className="text-xs leading-relaxed text-[var(--text-primary)] font-normal">
                            "{insight}"
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1">
                        <span className="flex items-center gap-1">
                            <LuShieldCheck className="text-emerald-400 text-xs" /> Stored locally
                        </span>
                        <button
                            type="button"
                            onClick={generateInsight}
                            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                        >
                            <LuRefreshCw className="text-[10px]" /> Update Insight
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
