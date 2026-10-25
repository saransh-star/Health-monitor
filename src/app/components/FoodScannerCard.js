'use client';

import Link from 'next/link';
import {
    LuCamera,
    LuUpload,
    LuSparkles,
    LuArrowRight,
    LuFileText,
} from 'react-icons/lu';

export default function FoodScannerCard() {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-[var(--accent-primary)]/30 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card-elevated)] to-[var(--bg-card)] p-5 sm:p-6 shadow-lg shadow-[var(--accent-glow)]/15">
            {/* Ambient decorative AI glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[var(--accent-secondary)]/10 rounded-full blur-3xl pointer-events-none -mb-20" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/25 text-[var(--accent-primary)] text-xs font-semibold">
                        <LuSparkles className="text-xs" />
                        <span>Gemini Multimodal AI Vision</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                        Scan your meal
                    </h2>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        Discover the nutrition behind every bite. Capture a photo to instantly identify ingredients, portions, calories, and macronutrients.
                    </p>

                    {/* Demo quick prompt */}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="text-[11px] text-[var(--text-muted)]">Quick test:</span>
                        <Link
                            href="/scan?demo=salad"
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] transition-colors"
                        >
                            Mediterranean Bowl
                        </Link>
                        <Link
                            href="/scan?demo=paneer"
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] transition-colors"
                        >
                            Paneer & Brown Rice
                        </Link>
                    </div>
                </div>

                {/* Primary & Secondary Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 sm:w-auto w-full">
                    <Link
                        href="/scan?mode=camera"
                        className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-sm shadow-md shadow-[var(--accent-glow)] hover:opacity-95 transition-all nutri-press"
                    >
                        <LuCamera className="text-lg" />
                        <span>Scan food</span>
                        <LuArrowRight className="text-sm ml-0.5" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href="/scan?mode=upload"
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-primary)] text-xs font-medium transition-colors nutri-press"
                        >
                            <LuUpload className="text-sm text-[var(--text-secondary)]" />
                            <span>Upload photo</span>
                        </Link>

                        <Link
                            href="/scan?mode=text"
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-primary)] text-xs font-medium transition-colors nutri-press"
                        >
                            <LuFileText className="text-sm text-[var(--text-secondary)]" />
                            <span>Describe</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
