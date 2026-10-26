import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { NUTRITION_SYSTEM_PROMPT } from '../../lib/prompts';

export const maxDuration = 60; // Allows Vercel hobby tier to run up to 60s without 504 Timeout

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function POST(request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json(
                { error: 'Google API key not configured. Set GOOGLE_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: NUTRITION_SYSTEM_PROMPT },
                        { text: `Analyze this meal: ${text}` },
                    ],
                },
            ],
        });

        let responseText = response.text;

        // Strip markdown code fences if present
        responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const nutrition = JSON.parse(responseText);

        return NextResponse.json(nutrition);
    } catch (error) {
        console.error('Text Analysis error:', error);

        let isRetryable = false;
        const errorMessage = error.message?.toLowerCase() || '';

        // Detect Quota Exceeded (429), Service Unavailable (503), or Invalid API Key (400) for testing
        if (
            errorMessage.includes('quota') ||
            errorMessage.includes('429') ||
            errorMessage.includes('503') ||
            errorMessage.includes('api key') ||
            errorMessage.includes('invalid_argument') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('unavailable') ||
            error.status === 429 ||
            error.status === 503 ||
            error.status === 400
        ) {
            isRetryable = true;
        }

        if (isRetryable) {
            return NextResponse.json(
                {
                    error: 'AI service is temporarily busy or out of quota. However, text inputs cannot currently be queued offline like photos, please try again soon.',
                    code: 'AI_UNAVAILABLE_RETRY'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to analyze text description' },
            { status: 500 }
        );
    }
}
