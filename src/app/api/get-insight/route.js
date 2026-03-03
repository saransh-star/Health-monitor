import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { weeklyStats, profile } = await request.json();

        // Provide safe un-initialized defaults if profile is null
        const safeProfile = profile || {
            dailyCalorieTarget: 2000,
            currentWeight: 'unknown',
            goalWeight: 'unknown',
            unit: 'kg'
        };

        // Ensure we actually have recent data
        let totalCalories = 0;
        let totalProtein = 0;
        const daysTracked = weeklyStats.filter(day => {
            totalCalories += day.calories;
            totalProtein += day.protein;
            return day.calories > 0;
        }).length;

        if (daysTracked === 0) {
            return NextResponse.json({
                insight: "Log some meals over the next few days to get your first personalized insight!"
            });
        }

        const avgCalories = Math.round(totalCalories / daysTracked);
        const avgProtein = Math.round(totalProtein / daysTracked);

        const prompt = `
        You are a supportive, expert nutritionist.
        The user is an Indian vegetarian.
        
        Profile Goals: 
        - Daily Calorie Target: ${safeProfile.dailyCalorieTarget} kcal
        - Current Weight: ${safeProfile.currentWeight} ${safeProfile.unit}
        - Goal Weight: ${safeProfile.goalWeight} ${safeProfile.unit}
        
        Over the last 7 days, they tracked meals on ${daysTracked} days.
        Their average daily intake was ${avgCalories} kcal and ${avgProtein}g of protein.
        
        Write a short, engaging 2-3 sentence coaching insight.
        Since they are Indian vegetarian, optionally suggest a specific, realistic high-protein vegetarian food (like paneer, dal, soy chunks, Greek yogurt, or chickpeas) if they need more protein.
        Do NOT use markdown. Do NOT use bullet points. Make it sound like a friendly text message from a human coach.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();

        return NextResponse.json({ insight: text.trim() });

    } catch (error) {
        console.error('Insight generation error:', error);
        return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
    }
}
