import { syncGithub } from './jobs/sync-github';
import { syncCms } from './jobs/sync-cms';
import { runTranslate } from './jobs/translate';

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  syncGithub();
  syncCms();
  runTranslate().catch((err) => console.error('[scheduler] translate failed:', err));

  setInterval(() => syncGithub(), 1000 * 60 * 60);  // every hour
  setInterval(() => syncCms(), 1000 * 60 * 30);       // every 30 min
  setInterval(
    () => runTranslate().catch((err) => console.error('[scheduler] translate failed:', err)),
    1000 * 60 * 60 * 6, // every 6 hours — keeps English in sync with Dutch edits
  );
}

