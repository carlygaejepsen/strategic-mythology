export const debugMode = false;

export function logDebug(message) {
    if (debugMode) {
        console.debug(message);
    }
}

export function logInfo(message) {
    console.info(message);
}

export function logWarn(message) {
    console.warn(message);
}

export function logError(message) {
    console.error(message);
}
