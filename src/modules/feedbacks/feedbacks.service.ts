import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from '../chats/schemas/chat.schema';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { TopicMastery, MasteryLevel } from '../topics/schemas/topic-mastery.schema';
import { GetFeedbackQueryDto } from './dto/get-feedback-query.dto';
import { GetFeedbackResponseDto } from './dto/get-feedback-response.dto';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { FeedbackAiService } from './services/feedback-ai.service';

@Injectable()
export class FeedbacksService {
  private readonly logger = new Logger(FeedbacksService.name);

  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(TopicMastery.name) private topicMasteryModel: Model<TopicMastery>,
    private readonly feedbackAiService: FeedbackAiService,
  ) {}

  async generateFeedback(chatId: string, locale?: string): Promise<GetFeedbackResponseDto> {
    const normalizedLocale = this.normalizeLocale(locale);

    // 1. Check if feedback already exists - return it if so
    const existingFeedback = await this.feedbackModel
      .findOne({ chatId: new Types.ObjectId(chatId) })
      .exec();

    if (
      existingFeedback &&
      existingFeedback.locale === normalizedLocale &&
      this.feedbackAiService.isFeedbackLocaleCompliant(
        {
          masteryScore: existingFeedback.masteryScore,
          missedConcepts: existingFeedback.missedConcepts,
          strengthsHighlighted: existingFeedback.strengthsHighlighted,
          gentleSuggestions: existingFeedback.gentleSuggestions,
        },
        normalizedLocale,
      )
    ) {
      return this.mapToResponseDto(existingFeedback);
    }

    // 2. Fetch chat with history
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) {
      throw new NotFoundException(`Chat not found: ${chatId}`);
    }

    // 3. Fetch topic context
    const topic = await this.topicModel.findById(chat.topicId).exec();
    if (!topic) {
      throw new NotFoundException(`Topic not found for chat: ${chatId}`);
    }

    // 4. Call AI to generate feedback
    const generatedFeedback = await this.feedbackAiService.generateFeedback({
      topicTitle: topic.title,
      topicDescription: topic.description,
      chatHistory: chat.chatItems.map(item => ({
        role: item.role,
        content: item.content,
      })),
      locale: normalizedLocale,
    });

    // 5. Save feedback to database
    const feedback = existingFeedback
      ? await this.feedbackModel
          .findByIdAndUpdate(
            existingFeedback._id,
            {
              masteryScore: generatedFeedback.masteryScore,
              missedConcepts: generatedFeedback.missedConcepts,
              strengthsHighlighted: generatedFeedback.strengthsHighlighted,
              gentleSuggestions: generatedFeedback.gentleSuggestions,
              locale: normalizedLocale,
            },
            { new: true, runValidators: true },
          )
          .exec()
      : await this.feedbackModel.create({
          chatId: new Types.ObjectId(chatId),
          masteryScore: generatedFeedback.masteryScore,
          missedConcepts: generatedFeedback.missedConcepts,
          strengthsHighlighted: generatedFeedback.strengthsHighlighted,
          gentleSuggestions: generatedFeedback.gentleSuggestions,
          locale: normalizedLocale,
        });

    if (!feedback) {
      throw new NotFoundException(`Failed to save feedback for chat: ${chatId}`);
    }

    // 6. Mark the chat as completed with feedback
    await this.chatModel.findByIdAndUpdate(chatId, {
      hasFeedback: true,
      feedbackId: feedback._id,
    });

    // Update topic mastery for this user
    await this.upsertTopicMastery(
      chat.userId,
      chat.topicId,
      generatedFeedback.masteryScore,
    );

    return this.mapToResponseDto(feedback);
  }

  async upsert(dto: UpsertFeedbackDto): Promise<GetFeedbackResponseDto> {
    const feedback = await this.feedbackModel.findOneAndUpdate(
      { chatId: new Types.ObjectId(dto.chatId) },
      {
        chatId: new Types.ObjectId(dto.chatId),
        masteryScore: dto.masteryScore,
        missedConcepts: dto.missedConcepts || [],
        strengthsHighlighted: dto.strengthsHighlighted || [],
        gentleSuggestions: dto.gentleSuggestions || [],
      },
      { upsert: true, new: true, runValidators: true },
    );

    return this.mapToResponseDto(feedback);
  }

  async findById(feedbackId: string): Promise<GetFeedbackResponseDto> {
    const feedback = await this.feedbackModel.findById(feedbackId).exec();

    if (!feedback) {
      throw new NotFoundException(`Feedback not found: ${feedbackId}`);
    }

    return this.mapToResponseDto(feedback);
  }

  async findByQuery(query: GetFeedbackQueryDto, locale?: string): Promise<GetFeedbackResponseDto> {
    if (!query.chatId) {
      throw new BadRequestException('chatId query parameter is required');
    }

    const feedback = await this.feedbackModel
      .findOne({ chatId: new Types.ObjectId(query.chatId) })
      .exec();

    if (!feedback) {
      throw new NotFoundException(`Feedback not found for chat: ${query.chatId}`);
    }

    if (
      feedback.locale !== this.normalizeLocale(locale) ||
      !this.feedbackAiService.isFeedbackLocaleCompliant(
        {
          masteryScore: feedback.masteryScore,
          missedConcepts: feedback.missedConcepts,
          strengthsHighlighted: feedback.strengthsHighlighted,
          gentleSuggestions: feedback.gentleSuggestions,
        },
        locale === 'en' ? 'en' : 'vi',
      )
    ) {
      return this.generateFeedback(query.chatId, locale);
    }

    return this.mapToResponseDto(feedback);
  }

  private normalizeLocale(locale?: string): 'vi' | 'en' {
    return locale === 'en' ? 'en' : 'vi';
  }

  private scoreToMasteryLevel(score: number): MasteryLevel {
    const clamped = Math.max(0, Math.min(100, score));
    if (clamped >= 80) return MasteryLevel.EXPERT;
    if (clamped >= 50) return MasteryLevel.INTERMEDIATE;
    return MasteryLevel.BEGINNER;
  }

  private async upsertTopicMastery(
    userId: Types.ObjectId,
    topicId: Types.ObjectId,
    masteryScore: number,
  ): Promise<void> {
    try {
      const updated = await this.topicMasteryModel.findOneAndUpdate(
        { userId, topicId },
        {
          $max: { bestScore: masteryScore },
          $inc: { taughtCount: 1 },
        },
        { upsert: true, new: true },
      );
      const newMasteryLevel = this.scoreToMasteryLevel(updated.bestScore);
      await this.topicMasteryModel.updateOne(
        { _id: updated._id },
        { $set: { masteryLevel: newMasteryLevel } },
      );
    } catch (error) {
      this.logger.error(
        `Failed to upsert TopicMastery for user ${userId.toString()}, topic ${topicId.toString()}`,
        error,
      );
    }
  }

  private mapToResponseDto(feedback: FeedbackDocument): GetFeedbackResponseDto {
    return {
      feedbackId: feedback._id.toString(),
      chatId: feedback.chatId.toString(),
      masteryScore: feedback.masteryScore,
      missedConcepts: feedback.missedConcepts,
      strengthsHighlighted: feedback.strengthsHighlighted,
      gentleSuggestions: feedback.gentleSuggestions,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }
}
