'use client';

import { useState } from 'react';
import MacroBar from './MacroBar';
import {
    LuFlame,
    LuUtensils,
    LuSparkles,
    LuTrash2,
    LuPencil,
    LuCheck,
    LuX,
    LuClock,
    LuChevronDown,
    LuChevronUp,
} from 'react-icons/lu';

export default function NutritionCard({
    meal,
    onDelete,
    showActions = true,
    isEditable = false,
    onMealChange = null,
}) {
    const [editingIndex, setEditingIndex] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [expanded, setExpanded] = useState(isEditable);

    if (!meal) return null;

    const hasDetails = (meal.foods && meal.foods.length > 0) || Boolean(meal.weightLossTip) || Boolean(meal.healthierAlternative);

    // Determine Meal Period from timestamp
    const getMealPeriod = (ts) => {
        if (!ts) return 'Meal';
        const d = new Date(ts);
        const hour = d.getHours();
        if (hour >= 5 && hour < 11) return 'Breakfast';
        if (hour >= 11 && hour < 16) return 'Lunch';
        if (hour >= 16 && hour < 22) return 'Dinner';
        return 'Late Snack';
    };

    const mealPeriod = getMealPeriod(meal.timestamp);

    // Health Score styling (1-10)
    const getHealthScoreColor = (score) => {
        if (score >= 8) return { text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/15 border-[var(--color-success)]/30' };
        if (score >= 5) return { text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/15 border-[var(--color-warning)]/30' };
        return { text: 'text-[var(--color-error)]', bg: 'bg-[var(--color-error)]/15 border-[var(--color-error)]/30' };
    };

    const healthStyle = getHealthScoreColor(meal.healthScore || 7);

    // Handle portion multiplier adjustment
    const applyMultiplier = (index, multiplier) => {
        if (!onMealChange || !meal.foods) return;

        const updatedFoods = meal.foods.map((food, i) => {
            if (i !== index) return food;
            const factor = multiplier;
            return {
                ...food,
                portionMultiplier: factor,
                calories: Math.round((food.baseCalories ?? food.calories) * factor),
                protein: Math.round(((food.baseProtein ?? food.protein) * factor) * 10) / 10,
                carbs: Math.round(((food.baseCarbs ?? food.carbs) * factor) * 10) / 10,
                fat: Math.round(((food.baseFat ?? food.fat) * factor) * 10) / 10,
                fiber: Math.round(((food.baseFiber ?? food.fiber) * factor) * 10) / 10,
                baseCalories: food.baseCalories ?? food.calories,
                baseProtein: food.baseProtein ?? food.protein,
                baseCarbs: food.baseCarbs ?? food.carbs,
                baseFat: food.baseFat ?? food.fat,
                baseFiber: food.baseFiber ?? food.fiber,
            };
        });

        recalculateTotals(updatedFoods);
    };

    // Remove single food item from composite meal
    const removeFoodItem = (index) => {
        if (!onMealChange || !meal.foods) return;
        const updatedFoods = meal.foods.filter((_, i) => i !== index);
        recalculateTotals(updatedFoods);
        setEditingIndex(null);
    };

    const recalculateTotals = (updatedFoods) => {
        const totalCalories = updatedFoods.reduce((acc, f) => acc + (f.calories || 0), 0);
        const totalProtein = Math.round(updatedFoods.reduce((acc, f) => acc + (f.protein || 0), 0) * 10) / 10;
        const totalCarbs = Math.round(updatedFoods.reduce((acc, f) => acc + (f.carbs || 0), 0) * 10) / 10;
        const totalFat = Math.round(updatedFoods.reduce((acc, f) => acc + (f.fat || 0), 0) * 10) / 10;
        const totalFiber = Math.round(updatedFoods.reduce((acc, f) => acc + (f.fiber || 0), 0) * 10) / 10;

        onMealChange({
            ...meal,
            foods: updatedFoods,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            totalFiber,
        });
    };

    const formattedTime = meal.timestamp
        ? new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Logged today';

    return (
        <article className="nutri-card p-4 sm:p-5 space-y-4 transition-all hover:border-[var(--text-muted)] animate-fade-in">
            {/* Header: Period tag, Food titles, Health score */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                            {mealPeriod}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                            <LuClock className="text-xs" />
                            <span>{formattedTime}</span>
                        </div>
                    </div>

                    <h3 className="font-bold text-base text-[var(--text-primary)] tracking-tight line-clamp-1">
                        {meal.foods?.map((f) => f.name).join(', ') || 'Nutrition Log'}
                    </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {meal.healthScore && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${healthStyle.bg} ${healthStyle.text} tabular-nums`}>
                            {meal.healthScore}/10 Health Score
                        </span>
                    )}

                    {showActions && onDelete && (
                        <div>
                            {confirmDelete ? (
                                <div className="flex items-center gap-1 bg-[var(--bg-app)] border border-[var(--color-error)] rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(meal.id)}
                                        className="text-[10px] font-semibold text-[var(--color-error)] px-2 py-0.5 hover:underline"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(false)}
                                        className="text-[var(--text-secondary)] p-0.5"
                                        title="Cancel"
                                    >
                                        <LuX className="text-xs" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-error)] transition-colors nutri-press"
                                    title="Delete meal entry"
                                    aria-label="Delete meal"
                                >
                                    <LuTrash2 className="text-sm" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Total Energy and Macros Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-color)]">
                <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Energy</span>
                    <span className="text-base font-bold text-[#FF6B50] tabular-nums">
                        {meal.totalCalories || 0} <span className="text-[10px] font-normal text-[var(--text-secondary)]">kcal</span>
                    </span>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Protein</span>
                    <span className="text-base font-bold text-[#45D6A0] tabular-nums">
                        {meal.totalProtein || 0} <span className="text-[10px] font-normal text-[var(--text-secondary)]">g</span>
                    </span>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Carbs</span>
                    <span className="text-base font-bold text-[#6EA8FE] tabular-nums">
                        {meal.totalCarbs || 0} <span className="text-[10px] font-normal text-[var(--text-secondary)]">g</span>
                    </span>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Fat</span>
                    <span className="text-base font-bold text-[#FFBF69] tabular-nums">
                        {meal.totalFat || 0} <span className="text-[10px] font-normal text-[var(--text-secondary)]">g</span>
                    </span>
                </div>
                <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Fiber</span>
                    <span className="text-base font-bold text-[#A78BFA] tabular-nums">
                        {meal.totalFiber || 0} <span className="text-[10px] font-normal text-[var(--text-secondary)]">g</span>
                    </span>
                </div>
            </div>

            {/* Collapsible Details & AI Tips Toggle */}
            {hasDetails && (
                <div className="pt-0.5">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors nutri-press"
                    >
                        <span className="font-medium inline-flex items-center gap-1.5">
                            <LuSparkles className="text-[var(--accent-primary)] text-xs" />
                            {expanded ? 'Hide Details & AI Tips' : `View Ingredients & AI Tips (${meal.foods?.length || 0} items)`}
                        </span>
                        {expanded ? <LuChevronUp className="text-xs" /> : <LuChevronDown className="text-xs" />}
                    </button>
                </div>
            )}

            {/* Expandable Breakdown and Tips */}
            {expanded && (
                <div className="space-y-3 pt-1 border-t border-[var(--border-color)] animate-fade-in">
                    {/* Per-item Breakdown (if multiple foods or editable) */}
                    {meal.foods && meal.foods.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                                Ingredients & Portions ({meal.foods.length})
                            </span>

                            <div className="space-y-1.5">
                                {meal.foods.map((food, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="font-semibold text-[var(--text-primary)] truncate">{food.name}</p>
                                            <p className="text-[11px] text-[var(--text-secondary)]">{food.portion}</p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-bold text-[var(--text-primary)] tabular-nums">
                                                {food.calories} kcal
                                            </span>

                                            {isEditable && (
                                                <div className="flex items-center gap-1">
                                                    {[0.5, 1, 1.5, 2].map((m) => (
                                                        <button
                                                            key={m}
                                                            type="button"
                                                            onClick={() => applyMultiplier(idx, m)}
                                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                                                                (food.portionMultiplier || 1) === m
                                                                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
                                                            }`}
                                                        >
                                                            {m}x
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFoodItem(idx)}
                                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--color-error)]"
                                                        title="Remove item"
                                                    >
                                                        <LuTrash2 className="text-xs" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Nutritionist Note & Healthier Alternative */}
                    {(meal.weightLossTip || meal.healthierAlternative) && (
                        <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-elevated)] space-y-1.5 text-xs">
                            {meal.weightLossTip && (
                                <div className="flex items-start gap-2">
                                    <LuSparkles className="text-[var(--accent-primary)] text-sm shrink-0 mt-0.5" />
                                    <p className="text-[var(--text-secondary)] leading-snug">
                                        <span className="font-semibold text-[var(--text-primary)]">Tip: </span>
                                        {meal.weightLossTip}
                                    </p>
                                </div>
                            )}
                            {meal.healthierAlternative && (
                                <div className="flex items-start gap-2 pt-1 border-t border-[var(--border-color)]">
                                    <LuUtensils className="text-[#45D6A0] text-sm shrink-0 mt-0.5" />
                                    <p className="text-[var(--text-secondary)] leading-snug">
                                        <span className="font-semibold text-[var(--text-primary)]">Swap Idea: </span>
                                        {meal.healthierAlternative}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
