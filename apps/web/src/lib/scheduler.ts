import { startScheduler } from '@portfolio/data';

let initialized = false;

export function ensureScheduler(): void {
  if (initialized) return;
  initialized = true;
  startScheduler();
}
