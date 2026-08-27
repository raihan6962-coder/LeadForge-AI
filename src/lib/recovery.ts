import { inngest } from '@/lib/inngest';
import { keywordRunsService, leadsService, outreachService, logsService } from '@/lib/firestore';

export async function recoverRunningJobs(): Promise<{ recovered: number; errors: string[] }> {
  const errors: string[] = [];
  let recovered = 0;

  try {
    const running = await keywordRunsService.getRunning();
    if (!running) return { recovered: 0, errors: [] };

    // Check if the job is actually still running or if it's stale
    const lastUpdate = new Date(running.checkpoint?.lastUpdate as string || running.startedAt);
    const now = new Date();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    if (now.getTime() - lastUpdate.getTime() > staleThreshold) {
      // Job appears stale — mark as paused for manual recovery
      await keywordRunsService.update(running.id, {
        status: 'paused' as const,
        checkpoint: {
          ...running.checkpoint,
          pausedReason: 'stale',
          pausedAt: now.toISOString(),
        },
      });

      await logsService.create({
        timestamp: now.toISOString(),
        event: 'Job Recovered',
        source: 'Recovery Engine',
        status: 'warning',
        details: `Stale job for "${running.keyword}" was paused. Last update: ${lastUpdate.toISOString()}`,
      });

      recovered++;
    }
  } catch (err) {
    errors.push(`Recovery error: ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  return { recovered, errors };
}

export function generateIdempotencyKey(...parts: string[]): string {
  return parts.join(':');
}

export async function checkIdempotency(key: string): Promise<boolean> {
  // In a real implementation, this would check Firestore for the key
  // For now, return false (not duplicate)
  return false;
}

export async function recordIdempotencyKey(key: string): Promise<void> {
  // In a real implementation, this would store the key in Firestore
}

export class ConcurrencyLock {
  private lockId: string;
  private lockCollection: string;

  constructor(lockId: string) {
    this.lockId = lockId;
    this.lockCollection = 'concurrency_locks';
  }

  async acquire(): Promise<boolean> {
    // Use Firestore transaction for atomic lock acquisition
    // In production, use a proper distributed lock
    return true;
  }

  async release(): Promise<void> {
    // Release the lock
  }
}
