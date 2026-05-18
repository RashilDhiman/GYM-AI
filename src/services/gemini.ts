import { APP_CONFIG } from '../config/appConfig';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function generateDietPlan(args: {
  age: string;
  weightKg: string;
  goal: string;
  dietaryPreference: string;
}): Promise<string> {
  const { age, weightKg, goal, dietaryPreference } = args;
  const apiKey = APP_CONFIG.geminiApiKey;
  if (!apiKey.trim()) {
    throw new Error(
      'Gemini API key is missing. Set GYM_AI_GEMINI_API_KEY in your environment.',
    );
  }

  const prompt = [
    'You are a fitness nutrition coach.',
    'Create a practical 7-day diet plan.',
    `Age: ${age || 'N/A'}`,
    `Weight: ${weightKg || 'N/A'} kg`,
    `Goal: ${goal || 'General fitness'}`,
    `Dietary preference: ${dietaryPreference || 'No preference'}`,
    'Output sections: calories target, macros, hydration, 7-day meals, supplement notes, and shopping list.',
    'Keep it concise and actionable.',
  ].join('\n');

  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1200,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
}

