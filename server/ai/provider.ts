import { google } from "@ai-sdk/google"

// Gemini 3 Flash Preview — free tier model used across all AI features (M11)
// Requires: GOOGLE_GENERATIVE_AI_API_KEY environment variable
export const gemini = google("gemini-3.5-flash-preview")
