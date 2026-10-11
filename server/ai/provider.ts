import { google } from "@ai-sdk/google"

// Requires: GOOGLE_GENERATIVE_AI_API_KEY environment variable.
// `gemini-3.5-flash-preview` is not a real model id and fails every request.
export const gemini = google("gemini-3.8-flash")

// Faster model for Iris. Multi-step tool calls on 3.8 Flash stall for tens of seconds.
export const irisModel = google("gemini-3.5-flash-lite")
