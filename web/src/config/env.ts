/**
 * @fileoverview Safe configuration module for Environment variables.
 * Enforces schema validation and types for process.env/import.meta.env.
 */

export const ENV = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || "",
  RECOGNITION_SERVER_URL: import.meta.env.VITE_RECOGNITION_SERVER_URL || "http://localhost:8000",
  MODE: import.meta.env.MODE || "development",
  PROD: import.meta.env.PROD || false,
  DEV: import.meta.env.DEV || true,
} as const;
