'use client';

import { useState } from 'react';
import { IoSparklesOutline, IoCloseCircle } from 'react-icons/io5';

export default function AIInsight({ weeklyStats, profile }) {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            setInsight(data.insight);
        } catch (err) {
            setError(err.message || 'Failed to generate insight');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IoSparklesOutline className="text-secondary-400 text-xl" />
                    <h3 className="font-semibold text-dark-50">AI Weekly Coach</h3>
                </div>
            </div>

            {!insight && !loading && (
                <div className="text-center py-2">
                    <p className="text-sm text-dark-400 mb-4">
                        Get personalized feedback based on your last 7 days of eating. (Vegetarian Indian diet considered)
                    </p>
                    <button
                        onClick={generateInsight}
                        className="w-full relative group overflow-hidden rounded-xl p-[1px]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-secondary-500 via-primary-500 to-secondary-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                        <div className="relative bg-dark-900/90 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-dark-800/80 mt-[1px] ml-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)]">
                            <IoSparklesOutline className="text-secondary-400" />
                            <span className="font-semibold text-white tracking-wide">Generate AI Insight</span>
                        </div>
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-dark-700"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-3 bg-dark-700 rounded w-3/4"></div>
                        <div className="h-3 bg-dark-700 rounded w-1/2"></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center mt-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mb-2">
                        <IoCloseCircle className="text-red-400 text-xl" />
                    </div>
                    <p className="text-sm font-medium text-red-400 mb-1">Insight Not Available</p>
                    <p className="text-xs text-red-300/70">{error}</p>
                </div>
            )}

            {insight && !loading && (
                <div className="p-4 bg-dark-800/50 rounded-xl glow-secondary relative">
                    <p className="text-sm leading-relaxed text-dark-200">{insight}</p>
                </div>
            )}
        </div>
    );
}
