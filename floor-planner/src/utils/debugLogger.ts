import { v4 as uuidv4 } from "uuid";

/**
 * debugLogger
 * -----------
 * Sends logs to an Express endpoint which appends them to debug.log on the server side.
 * 
 * Usage (client-side):
 *    debugLogger("Scene3D re-render", { wallsCount: walls.length });
 *
 * The server must implement POST /api/debug-logger to write logs to debug.log.
 */
export async function debugLogger(message: string, data?: any) {
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
    // If we cannot send logs to server, swallow the error or handle offline.
    console.warn("debugLogger failed:", err);
  }
}