'use client';

import { useState, useEffect } from 'react';
import { getProfile, saveProfile, getWeightHistory, saveWeight, deleteWeight } from '../actions';
import { IoScaleOutline, IoBodyOutline, IoFlameOutline, IoAddCircleOutline, IoTrashOutline, IoSaveOutline } from 'react-icons/io5';

const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise', multiplier: 1.2 },
    { value: 'light', label: 'Light', desc: '1-3 days/week', multiplier: 1.375 },
    { value: 'moderate', label: 'Moderate', desc: '3-5 days/week', multiplier: 1.55 },
    { value: 'active', label: 'Active', desc: '6-7 days/week', multiplier: 1.725 },
    { value: 'very-active', label: 'Very Active', desc: 'Athlete level', multiplier: 1.9 },
];

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [weights, setWeights] = useState([]);
    const [newWeight, setNewWeight] = useState('');
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        async function load() {
            setProfile(await getProfile());
            setWeights(await getWeightHistory());
            setMounted(true);
        }
        load();
    }, []);

    const handleSave = async () => {
        await saveProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddWeight = async () => {
        if (!newWeight || isNaN(parseFloat(newWeight))) return;
        const offset = new Date().getTimezoneOffset();
        await saveWeight({ weight: parseFloat(newWeight), timezoneOffset: offset });
        setWeights(await getWeightHistory());
        setNewWeight('');
        // Auto-update current weight on profile
        const updatedProfile = { ...profile, currentWeight: parseFloat(newWeight) };
        setProfile(updatedProfile);
        await saveProfile(updatedProfile);
    };

    const handleDeleteWeight = async (id) => {
        await deleteWeight(id);
        setWeights(await getWeightHistory());
    };

    const updateField = (key, value) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    if (!mounted || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const weightLoss = weights.length >= 2
        ? (weights[0].weight - weights[weights.length - 1].weight).toFixed(1)
        : null;

    return (
        <div className="space-y-5 py-4 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-dark-50">Profile & Goals</h1>
                <p className="text-sm text-dark-400 mt-1">Customize your weight loss plan</p>
            </div>

            {/* Name & Basic Info */}
            <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                        <IoBodyOutline className="text-white" />
                    </div>
                    <h2 className="font-semibold text-dark-100">Basic Info</h2>
                </div>

                <div className="space-y-3">
                    <InputField
                        label="Your Name"
                        value={profile.name}
                        onChange={(v) => updateField('name', v)}
                        placeholder="Enter your name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <InputField
                            label={`Height (cm)`}
                            value={profile.height}
                            onChange={(v) => updateField('height', parseFloat(v) || 0)}
                            type="number"
                            placeholder="170"
                        />
                        <InputField
                            label={`Current Weight (${profile.unit || 'kg'})`}
                            value={profile.currentWeight}
                            onChange={(v) => updateField('currentWeight', parseFloat(v) || 0)}
                            type="number"
                            placeholder="75"
                        />
                    </div>
                    <InputField
                        label={`Goal Weight (${profile.unit || 'kg'})`}
                        value={profile.goalWeight}
                        onChange={(v) => updateField('goalWeight', parseFloat(v) || 0)}
                        type="number"
                        placeholder="65"
                    />
                </div>
            </div>

            {/* Calorie Target */}
            <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <IoFlameOutline className="text-orange-400" />
                    </div>
                    <h2 className="font-semibold text-dark-100">Daily Target</h2>
                </div>

                <InputField
                    label="Daily Calorie Target (kcal)"
                    value={profile.dailyCalorieTarget}
                    onChange={(v) => updateField('dailyCalorieTarget', parseInt(v) || 1800)}
                    type="number"
                    placeholder="1800"
                />

                {/* Activity Level */}
                <div className="space-y-2">
                    <label className="text-xs text-dark-400 font-medium">Activity Level</label>
                    <div className="grid gap-2">
                        {ACTIVITY_LEVELS.map((level) => (
                            <button
                                key={level.value}
                                onClick={() => updateField('activityLevel', level.value)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${profile.activityLevel === level.value
                                    ? 'border-primary-500/50 bg-primary-500/10'
                                    : 'border-dark-700/50 bg-dark-900/50 hover:border-dark-600'
                                    }`}
                            >
                                <div>
                                    <p className={`text-sm font-medium ${profile.activityLevel === level.value ? 'text-primary-400' : 'text-dark-200'
                                        }`}>{level.label}</p>
                                    <p className="text-[10px] text-dark-400">{level.desc}</p>
                                </div>
                                {profile.activityLevel === level.value && (
                                    <div className="w-2 h-2 gradient-primary rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                className={`w-full font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${saved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/30'
                    }`}
            >
                <IoSaveOutline />
                {saved ? 'Saved ✓' : 'Save Profile'}
            </button>

            {/* Weight Tracking */}
            <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <IoScaleOutline className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-dark-100">Weight Log</h2>
                            {weightLoss && (
                                <p className={`text-xs ${parseFloat(weightLoss) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {parseFloat(weightLoss) > 0 ? '↓' : '↑'} {Math.abs(parseFloat(weightLoss))} {profile.unit || 'kg'} total
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Weight */}
                <div className="flex gap-2">
                    <input
                        type="number"
                        step="0.1"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        placeholder={`Weight (${profile.unit || 'kg'})`}
                        className="flex-1 bg-dark-900/50 border border-dark-700/50 rounded-xl px-3 py-2.5 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                    />
                    <button
                        onClick={handleAddWeight}
                        className="gradient-primary px-4 rounded-xl text-white flex items-center gap-1 text-sm font-medium active:scale-95 transition-transform"
                    >
                        <IoAddCircleOutline />
                        Add
                    </button>
                </div>

                {/* Weight History */}
                {weights.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {[...weights].reverse().map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono text-dark-200">{entry.weight} {profile.unit || 'kg'}</span>
                                    <span className="text-[10px] text-dark-500">{formatDate(entry.date)}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteWeight(entry.id)}
                                    className="p-1.5 rounded-lg text-dark-500 hover:text-danger hover:bg-danger/10 transition-all"
                                >
                                    <IoTrashOutline className="text-xs" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', placeholder }) {
    return (
        <div className="space-y-1">
            <label className="text-xs text-dark-400 font-medium">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-dark-900/50 border border-dark-700/50 rounded-xl px-3 py-2.5 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
        </div>
    );
}

function formatDate(dateStr) {
    const offset = new Date().getTimezoneOffset();
    const today = new Date();
    today.setMinutes(today.getMinutes() - offset);
    const todayStr = today.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
