import { inngest } from '@/lib/inngest';
import {
  leadsService, keywordRunsService,
  settingsService, logsService, notificationsService,
} from '@/lib/firestore';
import type { Lead, QualificationCriteria } from '@/types';

interface DiscoveryResult {
  leads: Partial<Lead>[];
  hasMore: boolean;
  totalFound: number;
}

async function discoverLeadsFromProvider(query: string, page: number): Promise<DiscoveryResult> {
  const results: Partial<Lead>[] = [];
  const count = Math.floor(Math.random() * 20) + 5;

  for (let i = 0; i < count; i++) {
    results.push({
      appName: `App_${query.replace(/\s/g, '')}_${page}_${i}`,
      developer: `Developer_${i}`,
      keyword: query,
      searchQuery: query,
      rating: Math.round((Math.random() * 2.5 + 2.5) * 10) / 10,
      installCount: Math.floor(Math.random() * 500000) + 1000,
      category: ['Health & Fitness', 'Lifestyle', 'Productivity', 'Tools'][Math.floor(Math.random() * 4)],
      country: ['US', 'UK', 'DE', 'FR', 'CA', 'AU'][Math.floor(Math.random() * 6)],
      website: Math.random() > 0.3 ? `https://example.com/${i}` : null,
      email: Math.random() > 0.2 ? `contact@example${i}.com` : null,
      emailValidity: (['valid', 'invalid', 'unknown', 'risky'] as const)[Math.floor(Math.random() * 4)],
      leadScore: Math.floor(Math.random() * 40) + 60,
    });
  }

  return { leads: results, hasMore: page < 5, totalFound: results.length };
}

function qualifyLead(lead: Partial<Lead>, criteria: QualificationCriteria): boolean {
  if (!lead.rating || lead.rating < criteria.minRating || lead.rating > criteria.maxRating) return false;
  if (!lead.installCount || lead.installCount < criteria.minInstalls || lead.installCount > criteria.maxInstalls) return false;
  if (criteria.requiredContactInfo && !lead.email) return false;
  if (criteria.requiredWebsite && !lead.website) return false;
  if (lead.country && criteria.excludedCountries.includes(lead.country)) return false;
  if (lead.category && criteria.excludedCategories.includes(lead.category)) return false;
  return true;
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

export const discoverLeads = inngest.createFunction(
  {
    id: 'discover-leads',
    name: 'Discover Leads',
    triggers: [{ event: 'lead/discover' }],
  },
  async ({ event, step }) => {
    const { keywordId, query, searchQueryId } = event.data;

    const run = await step.run('get-run', async () => keywordRunsService.getRunning());
    if (!run) return { error: 'No active run' };

    const settings = await step.run('get-settings', async () => settingsService.get());
    const criteria = settings?.qualification || {
      minRating: 3.0, maxRating: 5.0, minInstalls: 1000, maxInstalls: 500000,
      minAppAge: 30, maxAppAge: 3650, allowedCountries: [], allowedCategories: [],
      requiredContactInfo: true, requiredWebsite: false, requiredCompanyInfo: true,
      excludedCountries: [], excludedCategories: [], excludedKeywords: [],
      targetQualifiedCount: 1000, maxDiscoveryAttempts: 5000, searchExpansionDepth: 5,
    };

    let qualifiedCount = 0;
    let discoveredCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;
    let page = 1;
    const maxPages = 10;

    while (page <= maxPages) {
      const result = await step.run(`discover-page-${page}`, async () =>
        discoverLeadsFromProvider(query, page)
      );

      for (const rawLead of result.leads) {
        const leadId = await step.run(`process-lead-${page}-${rawLead.appName}`, async () => {
          const fullLead: Lead = {
            id: '',
            appName: rawLead.appName || '',
            developer: rawLead.developer || '',
            keyword: rawLead.keyword || query,
            searchQuery: rawLead.searchQuery || query,
            rating: rawLead.rating || 0,
            installCount: rawLead.installCount || 0,
            category: rawLead.category || '',
            country: rawLead.country || '',
            website: rawLead.website || null,
            email: rawLead.email || null,
            emailValidity: rawLead.emailValidity || 'unknown',
            leadScore: rawLead.leadScore || 0,
            qualificationStatus: 'pending',
            outreachStatus: 'none',
            replyStatus: 'none',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            notes: [],
            tags: [],
          };

          const isQualified = qualifyLead(fullLead, criteria);
          fullLead.qualificationStatus = isQualified ? 'qualified' : 'rejected';

          const leadId = await leadsService.upsert(fullLead);

          await logsService.create({
            timestamp: new Date().toISOString(),
            event: isQualified ? 'Lead Qualified' : 'Lead Rejected',
            source: 'Qualification Engine',
            status: isQualified ? 'success' : 'info',
            details: `${fullLead.appName} (${isQualified ? 'qualified' : 'rejected'}) — rating ${fullLead.rating}, ${fullLead.installCount} installs`,
          });

          return leadId;
        });

        discoveredCount++;
        const leadData = await step.run(`get-lead-${page}-${rawLead.appName}`, async () =>
          leadsService.get(leadId)
        );

        if (leadData?.qualificationStatus === 'qualified') qualifiedCount++;
        else if (leadData?.qualificationStatus === 'rejected') rejectedCount++;
      }

      const runStats = await step.run(`update-run-${page}`, async () => {
        await keywordRunsService.update(run.id, {
          leadsDiscovered: run.leadsDiscovered + discoveredCount,
          qualified: run.qualified + qualifiedCount,
          rejected: run.rejected + rejectedCount,
          phase: 'discovery',
        });
        return leadsService.countByKeyword(keywordId);
      });

      if (runStats.qualified >= criteria.targetQualifiedCount) {
        await step.run('target-reached', async () => {
          await logsService.create({
            timestamp: new Date().toISOString(),
            event: 'Target Reached',
            source: 'Discovery Engine',
            status: 'success',
            details: `Target of ${criteria.targetQualifiedCount} qualified leads reached for "${query}"`,
          });
          await notificationsService.create({
            type: 'success',
            title: 'Lead target reached',
            message: `Keyword "${query}" reached ${runStats.qualified} qualified leads`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            important: true,
          });
        });
        break;
      }

      if (!result.hasMore) break;
      page++;
    }

    await step.run('final-update', async () => {
      await keywordRunsService.update(run.id, {
        phase: 'qualification',
        searchQueriesUsed: [...run.searchQueriesUsed, query],
      });
    });

    return { keywordId, query, discovered: discoveredCount, qualified: qualifiedCount, rejected: rejectedCount, duplicates: duplicateCount };
  }
);
