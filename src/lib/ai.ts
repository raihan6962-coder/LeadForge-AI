interface AIProvider {
  generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
  classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }>;
  expand(query: string, maxResults?: number): Promise<string[]>;
}

class GroqProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(apiKey: string, model = 'llama-3.1-70b-versatile') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Groq API error: ${(err as Record<string, unknown>).error || res.status}`);
    }

    const data = await res.json() as Record<string, unknown>;
    const choices = data.choices as Array<Record<string, unknown>> | undefined;
    const firstChoice = choices?.[0] as Record<string, unknown> | undefined;
    const message = firstChoice?.message as Record<string, unknown> | undefined;
    return (message?.content as string) || '';
  }

  async classify(text: string, categories: string[]): Promise<{ category: string; confidence: number }> {
    const prompt = `Classify the following text into exactly one of these categories: ${categories.join(', ')}\n\nText: "${text}"\n\nRespond with JSON: {"category": "...", "confidence": 0.0-1.0}`;

    const result = await this.generate(prompt, { temperature: 0.1, maxTokens: 200 });
    try {
      const parsed = JSON.parse(result);
      return { category: parsed.category, confidence: parsed.confidence };
    } catch {
      return { category: 'unclear', confidence: 0.3 };
    }
  }

  async expand(query: string, maxResults = 5): Promise<string[]> {
    const prompt = `Generate ${maxResults} related search queries for: "${query}"\n\nRules:\n- Must be relevant to the original query\n- Avoid repeating the original query\n- Return as a JSON array of strings\n\nRespond with JSON: ["query1", "query2", ...]`;

    const result = await this.generate(prompt, { temperature: 0.7, maxTokens: 300 });
    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === 'string') : [];
    } catch {
      return [];
    }
  }
}

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider | null {
  if (providerInstance) return providerInstance;

  const apiKey = typeof window !== 'undefined'
    ? null // Never use API key on client side
    : process.env.GROQ_API_KEY;

  if (!apiKey) return null;

  providerInstance = new GroqProvider(apiKey);
  return providerInstance;
}

export type { AIProvider };
