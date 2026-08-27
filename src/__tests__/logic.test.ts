import { describe, it, expect } from 'vitest';

// Test qualification logic
function qualifyLead(lead: { rating: number; installCount: number; email?: string | null; website?: string | null; country?: string; category?: string }, criteria: {
  minRating: number; maxRating: number; minInstalls: number; maxInstalls: number;
  requiredContactInfo: boolean; requiredWebsite: boolean;
  excludedCountries: string[]; excludedCategories: string[];
}): boolean {
  if (lead.rating < criteria.minRating || lead.rating > criteria.maxRating) return false;
  if (lead.installCount < criteria.minInstalls || lead.installCount > criteria.maxInstalls) return false;
  if (criteria.requiredContactInfo && !lead.email) return false;
  if (criteria.requiredWebsite && !lead.website) return false;
  if (lead.country && criteria.excludedCountries.includes(lead.country)) return false;
  if (lead.category && criteria.excludedCategories.includes(lead.category)) return false;
  return true;
}

// Test deduplication logic
function generateDedupeKey(lead: { email?: string | null; developer?: string; appName?: string }): string {
  const email = lead.email?.toLowerCase().trim();
  if (email) return `email:${email}`;
  return `devapp:${lead.developer?.toLowerCase()}:${lead.appName?.toLowerCase()}`;
}

// Test email validation
function validateEmail(email: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

// Test reply classification
function classifyReply(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes('out of office') || text.includes('auto-reply')) return 'out_of_office';
  if (text.includes('delivery status notification') || text.includes('mailbox full')) return 'bounce';
  if (text.includes('this is an automated') || text.includes('do not reply')) return 'automated';
  const humanIndicators = ['interested', 'call', 'meeting', 'schedule'];
  if (humanIndicators.filter(i => text.includes(i)).length >= 2) return 'human';
  return 'unclear';
}

describe('Qualification Logic', () => {
  const criteria = {
    minRating: 3.0, maxRating: 5.0, minInstalls: 1000, maxInstalls: 500000,
    requiredContactInfo: true, requiredWebsite: false,
    excludedCountries: ['CN', 'RU'], excludedCategories: ['Gambling'],
  };

  it('qualifies a valid lead', () => {
    expect(qualifyLead({ rating: 4.0, installCount: 50000, email: 'test@example.com', country: 'US' }, criteria)).toBe(true);
  });

  it('rejects low rating', () => {
    expect(qualifyLead({ rating: 2.0, installCount: 50000, email: 'test@example.com' }, criteria)).toBe(false);
  });

  it('rejects too many installs', () => {
    expect(qualifyLead({ rating: 4.0, installCount: 600000, email: 'test@example.com' }, criteria)).toBe(false);
  });

  it('rejects missing email when required', () => {
    expect(qualifyLead({ rating: 4.0, installCount: 50000 }, criteria)).toBe(false);
  });

  it('rejects excluded country', () => {
    expect(qualifyLead({ rating: 4.0, installCount: 50000, email: 'test@example.com', country: 'CN' }, criteria)).toBe(false);
  });

  it('rejects excluded category', () => {
    expect(qualifyLead({ rating: 4.0, installCount: 50000, email: 'test@example.com', category: 'Gambling' }, criteria)).toBe(false);
  });
});

describe('Deduplication Logic', () => {
  it('generates email-based key when email exists', () => {
    expect(generateDedupeKey({ email: 'Test@Example.COM' })).toBe('email:test@example.com');
  });

  it('generates devapp key when no email', () => {
    expect(generateDedupeKey({ developer: 'FitTech Studios', appName: 'FitTrack Pro' })).toBe('devapp:fittech studios:fittrack pro');
  });

  it('handles null email', () => {
    expect(generateDedupeKey({ email: null, developer: 'Test', appName: 'App' })).toBe('devapp:test:app');
  });
});

describe('Email Validation', () => {
  it('validates correct email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('rejects null', () => {
    expect(validateEmail(null)).toBe(false);
  });

  it('normalizes email', () => {
    expect(validateEmail('  USER@EXAMPLE.COM  ')).toBe(true);
  });
});

describe('Reply Classification', () => {
  it('classifies out of office', () => {
    expect(classifyReply('Out of Office', 'I am currently out')).toBe('out_of_office');
  });

  it('classifies bounce', () => {
    expect(classifyReply('Delivery Status Notification', 'Mailbox full')).toBe('bounce');
  });

  it('classifies automated', () => {
    expect(classifyReply('Re: Test', 'This is an automated response')).toBe('automated');
  });

  it('classifies human reply', () => {
    expect(classifyReply('Re: Partnership', 'I am interested in scheduling a call')).toBe('human');
  });

  it('classifies unclear', () => {
    expect(classifyReply('Re: Test', 'Got it')).toBe('unclear');
  });
});
