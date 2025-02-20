// logger.js - Handles logging for debugging and error tracking
import { debugMode } from "../config.js"; // Adjust the path as necessary

export function logDebug(message) {
  if (debugMode) {
    console.debug(message);
  }
}

export function logError(message, error) {
  console.error(message, error);
}

export function logWarn(message) {
  console.warn(message);
}

export function logInfo(message) {
  console.info(message);
}
