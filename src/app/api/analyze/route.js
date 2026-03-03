import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allows Vercel hobby tier to run up to 60s without 504 Timeout

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const SYSTEM_PROMPT = `You are an expert nutritionist AI. Analyze the food in this image and provide a detailed nutritional breakdown.

RESPOND IN VALID JSON ONLY. No markdown, no extra text.

{
  "foods": [
    {
      "name": "Food item name",
      "portion": "Estimated portion size (e.g., 1 cup, 200g)",
      "calories": <number>,
      "protein": <grams as number>,
      "carbs": <grams as number>,
      "fat": <grams as number>,
      "fiber": <grams as number>
    }
  ],
  "totalCalories": <number>,
  "totalProtein": <number>,
  "totalCarbs": <number>,
  "totalFat": <number>,
  "totalFiber": <number>,
  "healthScore": <1-10 integer, 10 being healthiest>,
  "weightLossTip": "Brief, actionable weight-loss advice specific to this meal",
  "healthierAlternative": "A healthier swap suggestion for weight loss"
}

Be accurate with calorie estimates. Err on the side of slightly overestimating for weight loss safety. If you cannot identify food, set the name to "Unidentified" and provide your best estimate.`;

export async function POST(request) {
    try {
        // Use arrayBuffer and Buffer to decode the payload to bypass Next.js 
        // string length limits/warnings for base64 images
        const buffer = await request.arrayBuffer();
        const jsonStr = Buffer.from(buffer).toString('utf8');
        const { image, mimeType, description } = JSON.parse(jsonStr);

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
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
                        { text: SYSTEM_PROMPT },
                        ...(description ? [{ text: `User has additionally provided this description along with the image: ${description}` }] : []),
                        {
                            inlineData: {
                                mimeType: mimeType || 'image/jpeg',
                                data: image,
                            },
                        },
                    ],
                },
            ],
        });

        let text = response.text;

        // Strip markdown code fences if present
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const nutrition = JSON.parse(text);

        return NextResponse.json(nutrition);
    } catch (error) {
        console.error('Analysis error:', error);

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
                    error: 'AI service is temporarily busy or out of quota. Your image has been saved to retry later.',
                    code: 'AI_UNAVAILABLE_RETRY'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to analyze food image' },
            { status: 500 }
        );
    }
}
