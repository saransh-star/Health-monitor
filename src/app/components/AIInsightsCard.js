'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LuSparkles,
    LuArrowRight,
    LuRefreshCw,
    LuCheck,
    LuClock,
    LuTrendingUp,
    LuShieldCheck,
} from 'react-icons/lu';

const STORAGE_KEY = 'nutrisnap_last_ai_insight';

export default function AIInsightsCard({
    calories = 0,
    target = 1800,
    macros = { protein: 0, carbs: 0, fat: 0, fiber: 0 },
    targets = { protein: 135, carbs: 180, fat: 50, fiber: 30 },
    streak = 0,
    weeklyStats = [],
    profile = null,
}) {
    const [aiInsightText, setAiInsightText] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [statusToast, setStatusToast] = useState(null);
    const [error, setError] = useState(null);

    // 1. Load stored insight on initial mount ONLY - NEVER auto-fetch without user request
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.insight) {
                    setAiInsightText(parsed.insight);
                    setLastUpdated(parsed.updatedAt || 'Saved recently');
                }
            }
        } catch (err) {
            console.error('Failed to read saved insight from localStorage:', err);
        }
    }, []);

    // 2. Fetch/Update insight ONLY when explicitly triggered by the user
    const handleUpdateInsight = async () => {
        setLoadingAi(true);
        setError(null);
        setStatusToast(null);

        try {
            const res = await fetch('/api/get-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weeklyStats, profile }),
            });

            if (!res.ok) {
                throw new Error('Server responded with an error');
            }

            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }

            const newInsight = data.insight;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            });
            const dateStr = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            const formattedTime = `${dateStr}, ${timeStr}`;

            // Update local state
            setAiInsightText(newInsight);
            setLastUpdated(formattedTime);

            // Persist to localStorage
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    insight: newInsight,
                    updatedAt: formattedTime,
                    timestamp: Date.now(),
                })
            );

            setStatusToast('Insight updated & stored');
            setTimeout(() => setStatusToast(null), 3000);
        } catch (err) {
            console.error('Failed to update AI insight:', err);
            setError('Could not update insight right now. Please try again.');
        } finally {
            setLoadingAi(false);
        }
    };
    return (
        <section className="nutri-card p-5 sm:p-6 space-y-4">
            {/* Header: Title, Last Updated Timestamp & User Update Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 text-[var(--accent-primary)] flex items-center justify-center border border-[var(--accent-primary)]/30 shrink-0">
                        <LuSparkles className="text-lg" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                                Gemini AI Nutrition Coach
                            </h2>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                                Stored
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Tailored nutrition observations • Updates only on your request
                        </p>
                    </div>
                </div>

                {/* Controls: Timestamp & Explicit Update Button */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {lastUpdated && (
                        <div
                            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] font-medium"
                            title={`Insight saved in local storage on ${lastUpdated}`}
                        >
                            <LuClock className="text-[10px] text-[var(--text-muted)]" />
                            <span>Updated: {lastUpdated}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleUpdateInsight}
                        disabled={loadingAi}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-xs font-semibold text-[var(--accent-primary)] transition-all nutri-press shadow-xs disabled:opacity-50"
                        title="Click to generate a fresh AI analysis based on current food intake"
                    >
                        <LuRefreshCw className={`text-xs ${loadingAi ? 'animate-spin' : ''}`} />
                        <span>{loadingAi ? 'Analyzing...' : aiInsightText ? 'Update Insight' : 'Generate Insight'}</span>
                    </button>
                </div>
            </div>

            {/* Status Feedback Toast */}
            {statusToast && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-fade-in">
                    <LuCheck className="text-xs shrink-0" />
                    <span>{statusToast}</span>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                </div>
            )}

            {/* AI Insight Content Card */}
            {loadingAi ? (
                <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-3 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/30 animate-spin" />
                        <span className="text-xs font-semibold text-[var(--accent-primary)]">
                            Gemini is evaluating your daily macros and caloric pacing...
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3.5 bg-[var(--border-subtle)] rounded w-full" />
                        <div className="h-3.5 bg-[var(--border-subtle)] rounded w-5/6" />
                        <div className="h-3.5 bg-[var(--border-subtle)] rounded w-3/4" />
                    </div>
                </div>
            ) : aiInsightText ? (
                <div className="p-4 sm:p-5 rounded-2xl border border-[var(--accent-primary)]/25 bg-gradient-to-r from-[var(--accent-primary)]/10 via-[var(--bg-card-elevated)] to-[var(--bg-card)] space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)]">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                            <span>Nutritional Synthesis</span>
                        </div>
                        {lastUpdated && (
                            <span className="text-[10px] text-[var(--text-muted)] font-normal md:hidden">
                                {lastUpdated}
                            </span>
                        )}
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-normal">
                        "{aiInsightText}"
                    </p>

                    <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5">
                            <LuShieldCheck className="text-emerald-400 text-xs" />
                            <span>Persisted locally • Updates only when you tap 'Update Insight'</span>
                        </div>
                        <Link
                            href="/insights"
                            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                        >
                            Full Health Insights <LuArrowRight className="text-[10px]" />
                        </Link>
                    </div>
                </div>
            ) : (
                /* Empty / Initial State before user requests an insight */
                <div className="p-6 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card-elevated)] text-center space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center mx-auto text-lg">
                        <LuSparkles />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            No stored nutritional insight yet
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Your AI Coach synthesizes your meal logs, macro targets, and pacing to give you tailored recommendations. We will store it and only update it when you choose.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleUpdateInsight}
                        disabled={loadingAi}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-xs font-semibold shadow-md shadow-[var(--accent-glow)] hover:opacity-95 transition-all nutri-press"
                    >
                        <LuSparkles className="text-sm" />
                        <span>Generate First AI Insight</span>
                    </button>
                </div>
            )}

        </section>
    );
}
