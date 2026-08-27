import { inngest } from '@/lib/inngest';
import { analyticsService, leadsService, repliesService, logsService } from '@/lib/firestore';

export const aggregateAnalytics = inngest.createFunction(
  {
    id: 'aggregate-analytics',
    name: 'Aggregate Daily Analytics',
    triggers: [{ event: 'analytics/aggregate' }],
  },
  async ({ event, step }) => {
    const { date } = event.data;

    const stats = await step.run('compute-stats', async () => {
      const { leads } = await leadsService.list({ pageSize: 10000 });
      const replies = await repliesService.list();

      const today = new Date(date).toISOString().split('T')[0];

      const todayLeads = leads.filter(l => {
        const created = new Date(l.createdAt).toISOString().split('T')[0];
        return created === today;
      });

      const todayReplies = replies.filter(r => {
        const received = new Date(r.receivedAt).toISOString().split('T')[0];
        return received === today;
      });

      return {
        discovered: todayLeads.length,
        qualified: todayLeads.filter(l => l.qualificationStatus === 'qualified').length,
        rejected: todayLeads.filter(l => l.qualificationStatus === 'rejected').length,
        duplicates: todayLeads.filter(l => {
          const record = l as unknown as Record<string, unknown>;
          return typeof record.occurrenceCount === 'number' && record.occurrenceCount > 1;
        }).length,
        emailsSent: todayLeads.filter(l => l.outreachStatus === 'sent').length,
        emailsFailed: todayLeads.filter(l => l.outreachStatus === 'failed').length,
        emailsGenerated: todayLeads.filter(l => l.outreachStatus === 'queued').length,
        replies: todayReplies.length,
        humanReplies: todayReplies.filter(r => r.classification === 'human').length,
        automatedReplies: todayReplies.filter(r => r.classification === 'automated').length,
        bounceReplies: todayReplies.filter(r => r.classification === 'bounce').length,
        runtime: 0,
        overdueRuns: 0,
        failedRuns: 0,
      };
    });

    await step.run('save-analytics', async () => {
      await analyticsService.upsertDaily(date, stats);
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Analytics Aggregated',
        source: 'Analytics Engine',
        status: 'success',
        details: `Daily analytics for ${date}: ${stats.discovered} discovered, ${stats.qualified} qualified, ${stats.emailsSent} sent`,
      });
    });

    return { date, ...stats };
  }
);
