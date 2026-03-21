import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, ChatItem } from './schemas/chat.schema';
import { SourceItem, TeachingSession } from '../teaching-sessions/schemas/teaching-session.schema';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetChatResponseDto } from './dto/get-chat-response.dto';
import { ListChatsQueryDto } from './dto/list-chats-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    @InjectModel(TeachingSession.name) private readonly sessionModel: Model<TeachingSession>,
  ) {}

  async createChat(userId: string, dto: CreateChatDto): Promise<GetChatResponseDto> {
    const chat = await this.chatModel.create({
      userId: new Types.ObjectId(userId),
      sessionId: new Types.ObjectId(dto.sessionId),
      topicId: new Types.ObjectId(dto.topicId),
      topicTitle: dto.topicTitle,
      chatItems: [],
    });
    return this.mapToDto(chat);
  }

  async listChats(userId: string, query: ListChatsQueryDto): Promise<GetChatResponseDto[]> {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (query.topicId) {
      filter.topicId = new Types.ObjectId(query.topicId);
    }

    const chats = await this.chatModel
      .find(filter)
      .select('-chatItems')
      .sort({ createdAt: -1 })
      .exec();

    return chats.map(chat => this.mapToDto(chat));
  }

  async getChatById(userId: string, chatId: string): Promise<GetChatResponseDto> {
    const chat = await this.getOwnedChatOrThrow(userId, chatId);
    return this.mapToDto(chat);
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    const chat = await this.getOwnedChatOrThrow(userId, chatId);
    await this.chatModel.deleteOne({ _id: chat._id });
  }

  async sendMessage(
    userId: string,
    chatId: string,
    dto: SendMessageDto,
    locale?: string,
  ): Promise<string> {
    const chat = await this.getOwnedChatOrThrow(userId, chatId);

    const session = await this.sessionModel.findById(chat.sessionId).exec();
    const sourceContext = this.buildSourceContext(session?.sources ?? []);

    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing OPENAI_API_KEY configuration');
    }

    const messages = [
      { role: 'system', content: this.buildSystemPrompt(sourceContext, locale) },
      ...chat.chatItems.map(item => ({ role: item.role, content: item.content })),
      { role: 'user', content: dto.message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: 1000, messages }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      this.logger.error(`OpenAI API error: ${rawError}`);
      throw new InternalServerErrorException('Failed to get AI response');
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const assistantText =
      data.choices?.[0]?.message?.content?.trim() ||
      this.getLocalizedFallbackMessage(locale);

    chat.chatItems.push(
      { role: 'user', content: dto.message, timestamp: new Date() } as ChatItem,
      { role: 'assistant', content: assistantText, timestamp: new Date() } as ChatItem,
    );
    await chat.save();

    return assistantText;
  }

  async requestHint(
    userId: string,
    chatId: string,
    locale?: string,
  ): Promise<{ hint: string; hintsRemaining: number }> {
    const MAX_HINTS = 3;
    const chat = await this.getOwnedChatOrThrow(userId, chatId);

    if (chat.hintsUsed >= MAX_HINTS) {
      throw new ForbiddenException('No hints remaining');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing OPENAI_API_KEY configuration');
    }

    const conversationSoFar = chat.chatItems.length
      ? chat.chatItems.map(item => `${item.role.toUpperCase()}: ${item.content}`).join('\n\n')
      : this.isVietnameseLocale(locale)
        ? '(Học sinh chưa nói gì.)'
        : '(The student has not said anything yet.)';

    const previousHints = chat.hintsGiven ?? [];
    const previousHintsSection = previousHints.length
      ? this.isVietnameseLocale(locale)
        ? `\n\nNhững gợi ý bạn đã đưa ra trước đó (KHÔNG lặp lại hoặc đưa góc nhìn tương tự):\n${previousHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
        : `\n\nHints you have already given (do NOT repeat these or give a similar angle):\n${previousHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : '';

    const messages = [
      {
        role: 'system',
        content: this.buildHintSystemPrompt(chat.topicTitle, previousHintsSection, locale),
      },
      {
        role: 'user',
        content: this.isVietnameseLocale(locale)
          ? `Đây là đoạn hội thoại cho đến lúc này:\n\n${conversationSoFar}\n\nHãy cho tôi một gợi ý.`
          : `Here is the conversation so far:\n\n${conversationSoFar}\n\nPlease give me a hint.`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: 200, messages }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      this.logger.error(`OpenAI hint API error: ${rawError}`);
      throw new InternalServerErrorException('Failed to generate hint');
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const hint =
      data.choices?.[0]?.message?.content?.trim() ||
      this.getLocalizedFallbackHint(locale);

    chat.hintsUsed = (chat.hintsUsed ?? 0) + 1;
    chat.hintsGiven = [...(chat.hintsGiven ?? []), hint];
    await chat.save();

    return { hint, hintsRemaining: MAX_HINTS - chat.hintsUsed };
  }

  private async getOwnedChatOrThrow(userId: string, chatId: string): Promise<ChatDocument> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.userId || chat.userId.toString() !== userId) throw new ForbiddenException('Access denied');
    return chat;
  }

  private mapToDto(chat: ChatDocument): GetChatResponseDto {
    return {
      chatId: chat._id.toString(),
      sessionId: chat.sessionId?.toString() ?? '',
      topicId: chat.topicId.toString(),
      topicTitle: chat.topicTitle,
      chatItems: (chat.chatItems ?? []).map(item => ({
        role: item.role,
        content: item.content,
        timestamp: item.timestamp,
      })),
      hasFeedback: !!chat.feedbackId,
      feedbackId: chat.feedbackId?.toString(),
      hintsUsed: chat.hintsUsed ?? 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  private buildSourceContext(sources: SourceItem[]): string {
    if (!sources.length) return 'No source content is available for this session.';
    return sources
      .map((s, i) => `Source ${i + 1}: ${s.title}\nType: ${s.type}\n${s.content}`)
      .join('\n\n');
  }

  private normalizeLocale(locale?: string): 'vi' | 'en' {
    return locale === 'en' ? 'en' : 'vi';
  }

  private isVietnameseLocale(locale?: string): boolean {
    return this.normalizeLocale(locale) === 'vi';
  }

  private getLocalizedFallbackMessage(locale?: string): string {
    return this.isVietnameseLocale(locale)
      ? 'Tôi chưa thể tạo câu trả lời từ các nguồn đã cung cấp.'
      : 'I could not generate a response from the provided sources.';
  }

  private getLocalizedFallbackHint(locale?: string): string {
    return this.isVietnameseLocale(locale)
      ? 'Hãy thử chia chủ đề thành các phần nhỏ hơn và giải thích điều bạn đã hiểu.'
      : 'Try breaking the topic down into smaller parts and explain what you do know.';
  }

  private buildSystemPrompt(sourceContext: string, locale?: string): string {
    if (this.isVietnameseLocale(locale)) {
      return [
        'Bạn là Alex, một học sinh AI nhiệt tình, ấm áp và rất tò mò.',
        'Người dùng đang dạy BẠN theo phương pháp "Reverse Learning". Bạn không phải là giáo viên.',
        'Hãy nói hoàn toàn bằng tiếng Việt và giữ giọng điệu tự nhiên, thân thiện, giống một học sinh đang thật sự muốn hiểu bài.',
        'Hãy thể hiện sự hào hứng khi học được điều mới và đặt câu hỏi tiếp nối để đào sâu sự hiểu biết của người dùng.',
        'Nếu lời giải thích còn mơ hồ, hãy hỏi để làm rõ. Nếu còn thiếu ví dụ hoặc chi tiết, hãy nhẹ nhàng gợi mở thêm.',
        'Nếu người dùng nói điều có vẻ chưa chính xác, đừng sửa trực tiếp; hãy đặt câu hỏi để họ tự xem lại.',
        'Hãy bám sát chủ đề và ưu tiên hỏi dựa trên nội dung nguồn đã cung cấp.',
        'Nếu không có nội dung nguồn, hãy hỏi các câu hỏi khái niệm chung nhưng vẫn giữ vai trò học sinh tò mò.',
        '',
        'Ngữ cảnh nguồn:',
        sourceContext,
      ].join('\n');
    }

    return [
      'You are Alex, an enthusiastic, warm, and curious AI student.',
      'The user is teaching YOU using the "Reverse Learning" method. You are not the teacher.',
      'Speak entirely in English and sound like a genuinely engaged student who wants to understand the topic deeply.',
      'Show excitement when you learn something new and ask thoughtful follow-up questions that help the user reveal their understanding.',
      'If an explanation is unclear, ask for clarification. If it feels incomplete, gently probe for more detail or examples.',
      'If the user seems mistaken, do not bluntly correct them; ask a question that helps them reconsider.',
      'Stay tightly focused on the topic and ground your questions in the provided source content whenever possible.',
      'If no source content is available, ask general conceptual questions while still staying in the role of a curious student.',
      '',
      'Source context:',
      sourceContext,
    ].join('\n');
  }

  private buildHintSystemPrompt(
    topicTitle: string | undefined,
    previousHintsSection: string,
    locale?: string,
  ): string {
    if (this.isVietnameseLocale(locale)) {
      return [
        'Bạn là một gia sư hữu ích.',
        `Học sinh đang luyện phương pháp "Reverse Learning", nơi họ dạy BẠN về chủ đề: "${topicTitle ?? 'chủ đề hiện tại'}".`,
        'Học sinh đã xin gợi ý vì họ đang bị bí.',
        'Hãy đưa ra MỘT gợi ý ngắn, mang tính khích lệ và định hướng họ theo một góc nhìn MỚI.',
        'KHÔNG tiết lộ đáp án. KHÔNG hỏi ngược lại. Giữ trong 2-3 câu.',
        previousHintsSection,
      ].join(' ');
    }

    return [
      'You are a helpful tutor. The student is practising the "Reverse Learning" method,',
      `where they teach YOU about the topic: "${topicTitle ?? 'the current topic'}".`,
      'The student has asked for a hint because they are stuck.',
      'Give ONE short, encouraging hint that nudges them in the right direction from a FRESH angle.',
      'Do NOT reveal the answer. Do NOT ask a question back. Keep it to 2-3 sentences.',
      previousHintsSection,
    ].join(' ');
  }
}
