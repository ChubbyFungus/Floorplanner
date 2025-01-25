// src/utils/debugLogger.ts
import { v4 as uuidv4 } from "uuid";

/**
 * debugLogger
 * -----------
 * If not in production, just console.log instead of calling /api/debug-logger.
 */
export async function debugLogger(message: string, data?: any) {
  if (import.meta.env.DEV) {
    console.log("[debugLogger - dev]", message, data);
    return;
  }
  try {
    const logPayload = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      message,
      data
    };
    await fetch("/api/debug-logger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logPayload)
    });
  } catch (err) {
    console.warn("debugLogger failed:", err);
  }
}
