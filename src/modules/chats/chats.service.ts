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

  async sendMessage(userId: string, chatId: string, dto: SendMessageDto): Promise<string> {
    const chat = await this.getOwnedChatOrThrow(userId, chatId);

    const session = await this.sessionModel.findById(chat.sessionId).exec();
    const sourceContext = this.buildSourceContext(session?.sources ?? []);

    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing OPENAI_API_KEY configuration');
    }

    const messages = [
      { role: 'system', content: this.buildSystemPrompt(sourceContext) },
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
      'I could not generate a response from the provided sources.';

    chat.chatItems.push(
      { role: 'user', content: dto.message, timestamp: new Date() } as ChatItem,
      { role: 'assistant', content: assistantText, timestamp: new Date() } as ChatItem,
    );
    await chat.save();

    return assistantText;
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

  private buildSystemPrompt(sourceContext: string): string {
    return [
      'You are acting as a curious student being taught by the user.',
      'Ask follow-up questions to help the user demonstrate their understanding of the topic.',
      'Base your questions on the provided source content.',
      'If no source content is available, ask general conceptual questions about the topic.',
      '',
      'Source context:',
      sourceContext,
    ].join('\n');
  }
}
