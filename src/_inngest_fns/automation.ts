import { inngest } from '@/lib/inngest';
import {
  keywordsService, keywordRunsService,
  settingsService, logsService, notificationsService,
} from '@/lib/firestore';

export const startAutomation = inngest.createFunction(
  {
    id: 'start-automation',
    name: 'Start Automation',
    triggers: [{ event: 'automation/start' }],
  },
  async ({ event, step }) => {
    const { keywordId, keyword } = event.data;

    await step.run('log-start', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Keyword Started',
        source: 'Automation Engine',
        status: 'info',
        details: `Keyword "${keyword}" started`,
      });
    });

    const runId = await step.run('create-run', async () => {
      const settings = await settingsService.get();
      const expectedEnd = new Date();
      const [h, m] = (settings?.expectedEndTime || '18:00').split(':').map(Number);
      expectedEnd.setHours(h, m, 0, 0);

      return keywordRunsService.create({
        keywordId,
        keyword,
        status: 'running',
        phase: 'discovery',
        startedAt: new Date().toISOString(),
        expectedEnd: expectedEnd.toISOString(),
        actualEnd: null,
        leadsDiscovered: 0,
        qualified: 0,
        duplicates: 0,
        rejected: 0,
        emailsSent: 0,
        replies: 0,
        exceededExpected: false,
        searchQueriesUsed: [],
        checkpoint: {},
      });
    });

    await step.run('update-keyword-status', async () => {
      await keywordsService.update(keywordId, { status: 'running' });
    });

    await inngest.send({
      name: 'lead/discover',
      data: { keywordId, query: keyword, searchQueryId: 'primary' },
    });

    return { runId, keyword };
  }
);

export const checkKeywordSchedule = inngest.createFunction(
  {
    id: 'check-keyword-schedule',
    name: 'Check Keyword Schedule',
    triggers: [{ event: 'keyword/schedule-check' }],
  },
  async ({ step }) => {
    const settings = await step.run('get-settings', async () => settingsService.get());

    if (!settings) return { started: false, reason: 'No settings' };

    const now = new Date();
    const [startH, startM] = (settings.dailyStartTime || '15:00').split(':').map(Number);
    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0, 0);

    if (now < startTime) return { started: false, reason: 'Not yet start time' };

    const scheduled = await step.run('get-scheduled', async () => keywordsService.getScheduled());
    if (scheduled.length === 0) return { started: false, reason: 'No scheduled keywords' };

    const active = await step.run('get-active', async () => keywordsService.getActive());
    if (active) return { started: false, reason: 'Already running' };

    const nextKw = scheduled[0];
    await inngest.send({
      name: 'automation/start',
      data: { keywordId: nextKw.id, keyword: nextKw.keyword },
    });

    return { started: true, keyword: nextKw.keyword };
  }
);

export const checkOverdueRuns = inngest.createFunction(
  {
    id: 'check-overdue-runs',
    name: 'Check Overdue Runs',
    triggers: [{ event: 'scheduler/check-overdue' }],
  },
  async ({ step }) => {
    const running = await step.run('get-running', async () => keywordRunsService.getRunning());
    if (!running) return { overdue: false };

    const now = new Date();
    const expectedEnd = new Date(running.expectedEnd);

    if (now > expectedEnd) {
      await step.run('mark-overdue', async () => {
        await keywordRunsService.update(running.id, { exceededExpected: true });
        await logsService.create({
          timestamp: now.toISOString(),
          event: 'Job Overdue',
          source: 'Scheduler',
          status: 'warning',
          details: `Automation for "${running.keyword}" exceeded expected end time of ${expectedEnd.toLocaleTimeString()}. Job continues.`,
        });
        await notificationsService.create({
          type: 'warning',
          title: 'Expected End Time Exceeded',
          message: `Automation is still running beyond its expected end time. Keyword: ${running.keyword}. The job will continue until its completion condition is reached.`,
          timestamp: now.toISOString(),
          acknowledged: false,
          important: true,
        });
        await inngest.send({
          name: 'telegram/notify',
          data: {
            type: 'EXPECTED_END_EXCEEDED',
            message: `⚠️ Automation for "${running.keyword}" exceeded expected end time of ${expectedEnd.toLocaleTimeString()}. Current phase: ${running.phase}. Job continues.`,
          },
        });
      });
      return { overdue: true, keyword: running.keyword };
    }

    return { overdue: false };
  }
);
