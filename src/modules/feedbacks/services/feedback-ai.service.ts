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
  locale?: 'vi' | 'en';
};

@Injectable()
export class FeedbackAiService {
  private readonly logger = new Logger(FeedbackAiService.name);

  constructor(private readonly configService: ConfigService) {}

  isFeedbackLocaleCompliant(
    feedback: GeneratedFeedback,
    locale?: 'vi' | 'en',
  ): boolean {
    const normalizedLocale = this.normalizeLocale(locale);
    if (normalizedLocale === 'en') {
      return true;
    }

    return this.isFeedbackLikelyVietnamese(feedback);
  }

  async generateFeedback(input: FeedbackGenerationInput): Promise<GeneratedFeedback> {
    const apiKey = this.configService.get<string>('openai.apiKey') || process.env.OPENAI_API_KEY;
    const locale = this.normalizeLocale(input.locale);

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured, using fallback feedback');
      return this.buildFallbackFeedback(locale);
    }

    const model = this.configService.get<string>('openai.model') || 'gpt-4o-mini';
    const prompt = this.buildPrompt(input, locale);

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
              content: this.buildSystemPrompt(locale),
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
        return this.buildFallbackFeedback(locale);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        this.logger.warn('No content in OpenAI response, using fallback');
        return this.buildFallbackFeedback(locale);
      }

      const parsed = JSON.parse(content) as {
        masteryScore?: number;
        missedConcepts?: string[];
        strengthsHighlighted?: string[];
        gentleSuggestions?: string[];
      };

      const normalized = this.normalizeResponse(parsed);
      return this.ensureLocaleCompliance(normalized, locale, apiKey, model);
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${(error as Error).message}`);
      return this.buildFallbackFeedback(locale);
    }
  }

  private normalizeLocale(locale?: 'vi' | 'en'): 'vi' | 'en' {
    return locale === 'en' ? 'en' : 'vi';
  }

  private buildSystemPrompt(locale: 'vi' | 'en'): string {
    if (locale === 'vi') {
      return `Bạn là một chuyên gia giáo dục đang đánh giá mức độ hiểu bài của học sinh bằng phương pháp "Reverse Learning".
Trong phương pháp này, học sinh sẽ dạy CHÍNH BẠN (AI) về một chủ đề. Nhiệm vụ của bạn là đánh giá mức độ hiểu biết mà họ đã thể hiện.

Hãy khích lệ nhưng trung thực. Đưa ra phản hồi cụ thể, hữu ích và dễ hành động để học sinh cải thiện.

Toàn bộ nội dung phản hồi phải bằng tiếng Việt tự nhiên.
KHÔNG để sót cụm tiếng Anh trong các mảng văn bản.
Nếu có thuật ngữ kỹ thuật tiếng Anh, hãy dịch hoặc diễn đạt bằng tiếng Việt. Chỉ giữ các viết tắt cực kỳ phổ biến nếu cần, nhưng câu hoàn chỉnh vẫn phải là tiếng Việt.

Chỉ trả về JSON hợp lệ với đúng cấu trúc này:
{
  "masteryScore": <number 0-100>,
  "missedConcepts": ["concept1", "concept2"],
  "strengthsHighlighted": ["strength1", "strength2"],
  "gentleSuggestions": ["suggestion1", "suggestion2"]
}`;
    }

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

  private buildPrompt(input: FeedbackGenerationInput, locale: 'vi' | 'en'): string {
    const chatFormatted = input.chatHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const truncatedChat = chatFormatted.slice(0, 10000);

    if (locale === 'vi') {
      return `Hãy đánh giá mức độ hiểu bài của học sinh dựa trên phiên dạy này.

CHỦ ĐỀ: ${input.topicTitle}
MÔ TẢ: ${input.topicDescription}

BẢN GHI PHIÊN DẠY:
${truncatedChat}

Dựa trên cuộc trò chuyện này, hãy đánh giá:
1. masteryScore (0-100): Học sinh đã thể hiện mức độ hiểu chủ đề tốt đến đâu?
2. missedConcepts: Những khái niệm quan trọng nào các bạn ấy còn thiếu, giải thích sai, hoặc bỏ qua?
3. strengthsHighlighted: Họ đã giải thích tốt điểm nào?
4. gentleSuggestions: Những gợi ý nhẹ nhàng, khích lệ nào sẽ giúp họ cải thiện?

Yêu cầu bắt buộc:
- Mọi phần tử trong missedConcepts, strengthsHighlighted, gentleSuggestions đều phải viết bằng tiếng Việt.
- Không được để nguyên các mục tiếng Anh như "blocking I/O" hay "nonblocking I/O". Hãy chuyển chúng sang tiếng Việt.

Hãy trả về kết quả dưới dạng JSON.`;
    }

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

  private async ensureLocaleCompliance(
    feedback: GeneratedFeedback,
    locale: 'vi' | 'en',
    apiKey: string,
    model: string,
  ): Promise<GeneratedFeedback> {
    if (locale === 'en') {
      return feedback;
    }

    try {
      return await this.translateFeedbackToVietnamese(feedback, apiKey, model);
    } catch (error) {
      this.logger.warn(
        `Vietnamese feedback translation fallback failed: ${(error as Error).message}`,
      );
      return feedback;
    }
  }

  private isFeedbackLikelyVietnamese(feedback: GeneratedFeedback): boolean {
    const texts = [
      ...feedback.missedConcepts,
      ...feedback.strengthsHighlighted,
      ...feedback.gentleSuggestions,
    ].join(' ');

    if (!texts.trim()) {
      return true;
    }

    return /[ăâêôơưđĂÂÊÔƠƯĐáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/u.test(
      texts,
    );
  }

  private async translateFeedbackToVietnamese(
    feedback: GeneratedFeedback,
    apiKey: string,
    model: string,
  ): Promise<GeneratedFeedback> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `Rewrite the feedback JSON into strict natural Vietnamese.
Preserve the exact JSON structure and numeric values.
Translate every string field into Vietnamese.
Do not leave English phrases in the arrays.
Technical terms must also be rendered in Vietnamese where possible.
Return valid JSON only.`,
          },
          {
            role: 'user',
            content: JSON.stringify(feedback),
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Translation response was empty');
    }

    const parsed = JSON.parse(content) as {
      masteryScore?: number;
      missedConcepts?: string[];
      strengthsHighlighted?: string[];
      gentleSuggestions?: string[];
    };

    return this.normalizeResponse({
      masteryScore: feedback.masteryScore,
      missedConcepts: parsed.missedConcepts,
      strengthsHighlighted: parsed.strengthsHighlighted,
      gentleSuggestions: parsed.gentleSuggestions,
    });
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

  private buildFallbackFeedback(locale: 'vi' | 'en'): GeneratedFeedback {
    if (locale === 'vi') {
      return {
        masteryScore: 70,
        missedConcepts: ['Chưa thể phân tích cuộc trò chuyện lúc này, vui lòng thử lại sau'],
        strengthsHighlighted: ['Bạn đã hoàn thành phiên dạy, đó là một nỗ lực rất tốt'],
        gentleSuggestions: [
          'Hãy tiếp tục luyện tập bằng cách dạy lại chủ đề này một lần nữa',
          'Ôn lại các khái niệm cốt lõi và thử giải thích chúng bằng lời của bạn',
        ],
      };
    }

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
