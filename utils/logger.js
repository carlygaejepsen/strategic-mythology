// logger.js - Handles logging for debugging and error tracking

const debugMode = false; // Set to true to enable debugging logs, false to disable them

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
