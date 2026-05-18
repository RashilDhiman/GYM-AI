const rawKey =
  typeof process !== 'undefined' && process.env != null
    ? process.env.GYM_AI_GEMINI_API_KEY
    : undefined;

export const APP_CONFIG = {
  geminiApiKey: rawKey ?? '',
};
