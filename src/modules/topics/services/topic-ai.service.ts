import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AiGeneratedTopic = {
  title: string;
  difficulty: string;
  description: string;
};

@Injectable()
export class TopicAiService {
  private readonly logger = new Logger(TopicAiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateTopicsFromDocument(documentText: string): Promise<AiGeneratedTopic[]> {
    const apiKey = this.configService.get<string>('openai.apiKey') || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured, using fallback topic generation');
      return this.buildFallbackTopics(documentText);
    }

    const model = this.configService.get<string>('openai.model') || 'gpt-4o-mini';
    const prompt = this.buildPrompt(documentText);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content:
                'You generate concise learning topics from source content. Return valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const rawError = await response.text();
        this.logger.error(`OpenAI API error: ${rawError}`);
        return this.buildFallbackTopics(documentText);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return this.buildFallbackTopics(documentText);
      }

      const parsed = JSON.parse(content) as {
        topics?: Array<{ title?: string; difficulty?: string; description?: string }>;
      };

      const normalized = (parsed.topics || [])
        .map(topic => ({
          title: (topic.title || '').trim(),
          difficulty: this.normalizeDifficulty(topic.difficulty || ''),
          description: (topic.description || '').trim(),
        }))
        .filter(topic => topic.title && topic.description);

      if (!normalized.length) {
        return this.buildFallbackTopics(documentText);
      }

      return normalized;
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${(error as Error).message}`);
      return this.buildFallbackTopics(documentText);
    }
  }

  private buildPrompt(documentText: string): string {
    const truncated = documentText.slice(0, 12000);
    return [
      'Generate 5 learning topics from this document.',
      'Each topic must include: title, difficulty (easy|medium|hard), description.',
      'Return strict JSON with shape: {"topics":[{"title":"","difficulty":"easy|medium|hard","description":""}]}',
      '',
      'Document:',
      truncated,
    ].join('\n');
  }

  private normalizeDifficulty(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
      return normalized;
    }
    return 'medium';
  }

  private buildFallbackTopics(documentText: string): AiGeneratedTopic[] {
    const text = documentText.trim();
    const excerpt = text.slice(0, 300);

    return [
      {
        title: 'Core Concepts',
        difficulty: 'easy',
        description: excerpt || 'Overview of the main concepts from the uploaded document.',
      },
      {
        title: 'Applied Understanding',
        difficulty: 'medium',
        description: 'Practice-oriented topic derived from the document content.',
      },
      {
        title: 'Advanced Discussion',
        difficulty: 'hard',
        description: 'Higher-order analysis topic based on detailed sections of the document.',
      },
    ];
  }
}
