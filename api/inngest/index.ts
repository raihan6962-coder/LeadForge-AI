import { serve } from 'inngest/express';
import { inngest } from '../../src/lib/inngest';
import { startAutomation, checkKeywordSchedule, checkOverdueRuns } from '../../src/functions/automation';
import { discoverLeads } from '../../src/functions/lead-discovery';
import { sendOutreachBatch, sendSingleOutreach, generatePersonalizedEmail } from '../../src/functions/email-outreach';
import { sendTelegramNotification } from '../../src/functions/telegram-notify';
import { checkReplyInbox, classifyIncomingReply, forwardReply } from '../../src/functions/reply-monitor';
import { syncGoogleSheets } from '../../src/functions/google-sheets-sync';
import { aggregateAnalytics } from '../../src/functions/analytics';
import type { IncomingMessage, ServerResponse } from 'http';

const handler = serve({
  client: inngest,
  functions: [
    startAutomation,
    checkKeywordSchedule,
    checkOverdueRuns,
    discoverLeads,
    sendOutreachBatch,
    sendSingleOutreach,
    generatePersonalizedEmail,
    sendTelegramNotification,
    checkReplyInbox,
    classifyIncomingReply,
    forwardReply,
    syncGoogleSheets,
    aggregateAnalytics,
  ],
});

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
