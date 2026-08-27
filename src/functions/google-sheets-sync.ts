import { inngest } from '@/lib/inngest';
import { settingsService, templatesService, keywordsService, logsService, integrationLogsService } from '@/lib/firestore';
import type { EmailTemplate } from '@/types';

async function fetchGoogleSheetData(url: string): Promise<{ keyword: string; template: { subject: string; body: string } }[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error('Expected array response');

    return data
      .filter((row: Record<string, string>) => row.keyword && row.subject && row.body)
      .map((row: Record<string, string>) => ({
        keyword: row.keyword.trim().toLowerCase(),
        template: {
          subject: row.subject.trim(),
          body: row.body.trim(),
        },
      }));
  } catch (err) {
    throw new Error(`Google Sheets fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export const syncGoogleSheets = inngest.createFunction(
  {
    id: 'sync-google-sheets',
    name: 'Sync Google Sheets',
    triggers: [{ event: 'sheets/sync' }],
  },
  async ({ step }) => {
    const settings = await step.run('get-settings', async () => settingsService.get());
    const sheetsUrl = settings?.googleSheets?.webAppUrl;

    if (!sheetsUrl) {
      await step.run('log-no-url', async () => {
        await logsService.create({
          timestamp: new Date().toISOString(),
          event: 'Integration Failure',
          source: 'Google Sheets',
          status: 'error',
          details: 'Google Sheets Web App URL not configured',
        });
      });
      return { synced: false, reason: 'No URL configured' };
    }

    let rows: Awaited<ReturnType<typeof fetchGoogleSheetData>>;
    try {
      rows = await step.run('fetch-sheet', async () => fetchGoogleSheetData(sheetsUrl));
    } catch (err) {
      await step.run('log-error', async () => {
        await logsService.create({
          timestamp: new Date().toISOString(),
          event: 'Integration Failure',
          source: 'Google Sheets',
          status: 'error',
          details: `Failed to fetch: ${err instanceof Error ? err.message : 'Unknown'}`,
        });
        await integrationLogsService.create({
          integration: 'google_sheets',
          event: 'sync',
          status: 'error',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      });
      return { synced: false, error: err instanceof Error ? err.message : 'Unknown' };
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const result = await step.run(`import-${row.keyword}`, async () => {
        const existing = await templatesService.getByKeyword(row.keyword);
        if (existing) {
          skipped++;
          return { action: 'skipped' };
        }

        const template: EmailTemplate = {
          id: '',
          keyword: row.keyword,
          name: `${row.keyword} template`,
          subject: row.template.subject,
          body: row.template.body,
          variables: ['app_name', 'developer_name', 'rating', 'install_count', 'category'],
          lastUpdated: new Date().toISOString(),
          status: 'active',
        };

        const templateId = await templatesService.upsert(template);

        const existingKeywords = await keywordsService.list();
        const matchingKeyword = existingKeywords.find(k => k.keyword === row.keyword);
        if (matchingKeyword) {
          await keywordsService.update(matchingKeyword.id, { templateId });
        }

        imported++;
        return { action: 'imported', templateId };
      });

      if (result.action === 'skipped') skipped++;
    }

    await step.run('log-success', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Sheets Sync',
        source: 'Google Sheets',
        status: 'success',
        details: `Sync complete: ${imported} imported, ${skipped} skipped from ${rows.length} rows`,
      });
      await integrationLogsService.create({
        integration: 'google_sheets',
        event: 'sync',
        status: 'success',
        details: `${imported} templates imported, ${skipped} skipped`,
      });
    });

    return { synced: true, imported, skipped, total: rows.length };
  }
);
