import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatTeachingSessionDto } from './dto/chat-teaching-session.dto';
import { CreateTeachingSessionDto } from './dto/create-teaching-session.dto';
import { PatchTeachingSessionDto } from './dto/patch-teaching-session.dto';
import { ChatMessageItem, SourceItem, TeachingSession } from './schemas/teaching-session.schema';

@Injectable()
export class TeachingSessionsService {
  private readonly logger = new Logger(TeachingSessionsService.name);

  constructor(@InjectModel(TeachingSession.name) private sessionModel: Model<TeachingSession>) {}

  async listSessions(userId: string): Promise<TeachingSession[]> {
    this.ensureValidUserId(userId);
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async createSession(userId: string, dto: CreateTeachingSessionDto): Promise<TeachingSession> {
    this.ensureValidUserId(userId);

    const created = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      topic: dto.topic,
      sources: [],
      chatHistory: [],
    });

    return created.save();
  }

  async getSessionById(userId: string, sessionId: string): Promise<TeachingSession> {
    return this.getOwnedSessionOrThrow(userId, sessionId);
  }

  async updateSession(
    userId: string,
    sessionId: string,
    dto: PatchTeachingSessionDto,
  ): Promise<TeachingSession> {
    const session = await this.getOwnedSessionOrThrow(userId, sessionId);

    if (dto.title !== undefined) {
      session.title = dto.title;
    }

    if (dto.topic !== undefined) {
      session.topic = dto.topic;
    }

    if (dto.summary !== undefined) {
      session.summary = dto.summary;
    }

    if (dto.source) {
      session.sources.push(dto.source as SourceItem);
    }

    if (dto.chatHistory) {
      session.chatHistory = dto.chatHistory.map(message => ({
        ...message,
        timestamp: message.timestamp ?? new Date(),
      })) as ChatMessageItem[];
    }

    return session.save();
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.getOwnedSessionOrThrow(userId, sessionId);
    await this.sessionModel.deleteOne({ _id: session._id });
  }

  async chatWithSession(
    userId: string,
    sessionId: string,
    dto: ChatTeachingSessionDto,
  ): Promise<string> {
    const session = await this.getOwnedSessionOrThrow(userId, sessionId);

    const sourceContext = this.buildSourceContext(session.sources);
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing ANTHROPIC_API_KEY configuration');
    }

    const messages = [
      ...session.chatHistory.map(entry => ({ role: entry.role, content: entry.content })),
      { role: 'user', content: dto.message },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: this.buildSystemPrompt(sourceContext),
        messages,
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      this.logger.error(`Anthropic API error: ${rawError}`);
      throw new InternalServerErrorException('Failed to get AI response');
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const assistantText =
      data.content
        ?.filter(block => block.type === 'text' && block.text)
        .map(block => block.text)
        .join('\n')
        .trim() || 'I could not generate a response from the provided sources.';

    session.chatHistory.push(
      { role: 'user', content: dto.message, timestamp: new Date() } as ChatMessageItem,
      { role: 'assistant', content: assistantText, timestamp: new Date() } as ChatMessageItem,
    );

    await session.save();
    return assistantText;
  }

  private ensureValidUserId(userId: string): void {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }
  }

  private ensureValidSessionId(sessionId: string): void {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestException('Invalid session id');
    }
  }

  private async getOwnedSessionOrThrow(
    userId: string,
    sessionId: string,
  ): Promise<TeachingSession> {
    this.ensureValidUserId(userId);
    this.ensureValidSessionId(sessionId);

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException('Teaching session not found');
    }

    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this teaching session');
    }

    return session;
  }

  private buildSourceContext(sources: SourceItem[]): string {
    if (!sources.length) {
      return 'No source content is available for this session.';
    }

    return sources
      .map(
        (source, index) =>
          `Source ${index + 1}: ${source.title}\nType: ${source.type}\n${source.content}`,
      )
      .join('\n\n');
  }

  private buildSystemPrompt(sourceContext: string): string {
    return [
      'You are a Teaching Assistant.',
      'Answer strictly based on the provided source content.',
      'If the answer is not in the sources, say that the sources do not contain enough information.',
      '',
      'Source context:',
      sourceContext,
    ].join('\n');
  }
}
