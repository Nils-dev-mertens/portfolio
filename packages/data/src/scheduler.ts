import { syncGithub } from './jobs/sync-github';
import { syncCms } from './jobs/sync-cms';

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  syncGithub();
  syncCms();

  setInterval(() => syncGithub(), 1000 * 60 * 60);  // every hour
  setInterval(() => syncCms(), 1000 * 60 * 30);       // every 30 min
}
