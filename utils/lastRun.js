let lastRun = null;

/**
 * Checks if enough time has passed since last scheduler run.
 * Returns true if should run again.
 */
export function shouldRunScheduler(intervalMinutes = 5) {
  const now = Date.now();
  if (!lastRun || now - lastRun > intervalMinutes * 60 * 1000) {
    lastRun = now;
    return true;
  }
  return false;
}
