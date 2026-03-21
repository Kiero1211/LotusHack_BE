import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GeneratedFeedback = {
  masteryScore: number;
  missedConcepts: string[];
  strengthsHighlighted: string[];
  gentleSuggestions: string[];
};

export type FeedbackGenerationInput = {
  topicTitle: string;
  topicDescription: string;
  chatHistory: Array<{ role: string; content: string }>;
};

@Injectable()
export class FeedbackAiService {
  private readonly logger = new Logger(FeedbackAiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateFeedback(input: FeedbackGenerationInput): Promise<GeneratedFeedback> {
    const apiKey = this.configService.get<string>('openai.apiKey') || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured, using fallback feedback');
      return this.buildFallbackFeedback();
    }

    const model = this.configService.get<string>('openai.model') || 'gpt-4o-mini';
    const prompt = this.buildPrompt(input);

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
              content: this.buildSystemPrompt(),
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
        return this.buildFallbackFeedback();
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        this.logger.warn('No content in OpenAI response, using fallback');
        return this.buildFallbackFeedback();
      }

      const parsed = JSON.parse(content) as {
        masteryScore?: number;
        missedConcepts?: string[];
        strengthsHighlighted?: string[];
        gentleSuggestions?: string[];
      };

      return this.normalizeResponse(parsed);
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${(error as Error).message}`);
      return this.buildFallbackFeedback();
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert educator evaluating a student's understanding using the "Reverse Learning" method.
In this method, the student teaches YOU (the AI) about a topic. Your job is to evaluate how well they demonstrated their understanding.

Be encouraging but honest. Provide actionable feedback that helps the student improve.

Return valid JSON only with this exact structure:
{
  "masteryScore": <number 0-100>,
  "missedConcepts": ["concept1", "concept2"],
  "strengthsHighlighted": ["strength1", "strength2"],
  "gentleSuggestions": ["suggestion1", "suggestion2"]
}`;
  }

  private buildPrompt(input: FeedbackGenerationInput): string {
    const chatFormatted = input.chatHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const truncatedChat = chatFormatted.slice(0, 10000);

    return `Evaluate the student's understanding based on their teaching session.

TOPIC: ${input.topicTitle}
DESCRIPTION: ${input.topicDescription}

TEACHING SESSION TRANSCRIPT:
${truncatedChat}

Based on this conversation, evaluate:
1. masteryScore (0-100): How well did the student demonstrate understanding of the topic?
2. missedConcepts: What key concepts did they miss, explain incorrectly, or skip over?
3. strengthsHighlighted: What did they explain particularly well?
4. gentleSuggestions: What gentle, encouraging suggestions would help them improve?

Return your evaluation as JSON.`;
  }

  private normalizeResponse(parsed: {
    masteryScore?: number;
    missedConcepts?: string[];
    strengthsHighlighted?: string[];
    gentleSuggestions?: string[];
  }): GeneratedFeedback {
    return {
      masteryScore: this.normalizeScore(parsed.masteryScore),
      missedConcepts: this.normalizeStringArray(parsed.missedConcepts),
      strengthsHighlighted: this.normalizeStringArray(parsed.strengthsHighlighted),
      gentleSuggestions: this.normalizeStringArray(parsed.gentleSuggestions),
    };
  }

  private normalizeScore(score: number | undefined): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return 70;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private normalizeStringArray(arr: string[] | undefined): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr.filter(item => typeof item === 'string' && item.trim().length > 0);
  }

  private buildFallbackFeedback(): GeneratedFeedback {
    return {
      masteryScore: 70,
      missedConcepts: ['Unable to analyze the conversation - please try again later'],
      strengthsHighlighted: ['You completed the teaching session - great effort!'],
      gentleSuggestions: [
        'Continue practicing by teaching this topic again',
        'Review the core concepts and try to explain them in your own words',
      ],
    };
  }
}
