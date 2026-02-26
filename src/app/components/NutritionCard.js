'use client';

import MacroBar from './MacroBar';
import { IoFlame, IoLeafOutline, IoArrowDown, IoTrashOutline } from 'react-icons/io5';

export default function NutritionCard({ meal, onDelete, showActions = true }) {
    if (!meal) return null;

    const healthColor =
        meal.healthScore >= 7 ? 'text-green-400' :
            meal.healthScore >= 4 ? 'text-amber-400' : 'text-red-400';

    const healthBg =
        meal.healthScore >= 7 ? 'bg-green-500/10' :
            meal.healthScore >= 4 ? 'bg-amber-500/10' : 'bg-red-500/10';

    return (
        <div className="glass rounded-2xl p-4 animate-slide-up space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="gradient-primary w-10 h-10 rounded-xl flex items-center justify-center">
                        <IoFlame className="text-white text-lg" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark-100">
                            {meal.foods?.map((f) => f.name).join(', ') || 'Meal'}
                        </h3>
                        <p className="text-xs text-dark-400">
                            {meal.timestamp
                                ? new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${healthBg} ${healthColor}`}>
                        {meal.healthScore}/10
                    </span>
                    {showActions && onDelete && (
                        <button
                            onClick={() => onDelete(meal.id)}
                            className="p-2 rounded-lg text-dark-500 hover:text-danger hover:bg-danger/10 transition-all"
                        >
                            <IoTrashOutline />
                        </button>
                    )}
                </div>
            </div>

            {/* Calories */}
            <div className="flex items-center justify-center py-2">
                <span className="text-4xl font-bold gradient-text">{meal.totalCalories}</span>
                <span className="text-dark-400 text-sm ml-2">kcal</span>
            </div>

            {/* Food items */}
            {meal.foods && meal.foods.length > 0 && (
                <div className="space-y-2">
                    {meal.foods.map((food, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-dark-900/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <IoLeafOutline className="text-primary-400 text-xs" />
                                <span className="text-dark-200">{food.name}</span>
                                <span className="text-dark-500 text-xs">({food.portion})</span>
                            </div>
                            <span className="text-dark-300 font-mono text-xs">{food.calories} kcal</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Macros */}
            <div className="grid grid-cols-2 gap-3">
                <MacroBar label="Protein" value={meal.totalProtein || 0} />
                <MacroBar label="Carbs" value={meal.totalCarbs || 0} />
                <MacroBar label="Fat" value={meal.totalFat || 0} />
                <MacroBar label="Fiber" value={meal.totalFiber || 0} />
            </div>

            {/* Tips */}
            {(meal.weightLossTip || meal.healthierAlternative) && (
                <div className="space-y-2 pt-2 border-t border-dark-700/50">
                    {meal.weightLossTip && (
                        <div className="flex items-start gap-2 text-xs">
                            <IoArrowDown className="text-primary-400 mt-0.5 shrink-0" />
                            <p className="text-dark-300">{meal.weightLossTip}</p>
                        </div>
                    )}
                    {meal.healthierAlternative && (
                        <div className="flex items-start gap-2 text-xs">
                            <IoLeafOutline className="text-accent-400 mt-0.5 shrink-0" />
                            <p className="text-dark-300">{meal.healthierAlternative}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
