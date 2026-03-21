import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(TopicMastery.name) private topicMasteryModel: Model<TopicMastery>,
    private readonly feedbackAiService: FeedbackAiService,
  ) {}

  async generateFeedback(chatId: string): Promise<GetFeedbackResponseDto> {
    // 1. Check if feedback already exists - return it if so
    const existingFeedback = await this.feedbackModel
      .findOne({ chatId: new Types.ObjectId(chatId) })
      .exec();

    if (existingFeedback) {
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
    });

    // 5. Save feedback to database
    const feedback = await this.feedbackModel.create({
      chatId: new Types.ObjectId(chatId),
      masteryScore: generatedFeedback.masteryScore,
      missedConcepts: generatedFeedback.missedConcepts,
      strengthsHighlighted: generatedFeedback.strengthsHighlighted,
      gentleSuggestions: generatedFeedback.gentleSuggestions,
    });

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

  async findByQuery(query: GetFeedbackQueryDto): Promise<GetFeedbackResponseDto> {
    if (!query.chatId) {
      throw new BadRequestException('chatId query parameter is required');
    }

    const feedback = await this.feedbackModel
      .findOne({ chatId: new Types.ObjectId(query.chatId) })
      .exec();

    if (!feedback) {
      throw new NotFoundException(`Feedback not found for chat: ${query.chatId}`);
    }

    return this.mapToResponseDto(feedback);
  }

  private scoreToMasteryLevel(score: number): MasteryLevel {
    if (score >= 80) return MasteryLevel.EXPERT;
    if (score >= 50) return MasteryLevel.INTERMEDIATE;
    return MasteryLevel.BEGINNER;
  }

  private async upsertTopicMastery(
    userId: Types.ObjectId,
    topicId: Types.ObjectId,
    masteryScore: number,
  ): Promise<void> {
    const existing = await this.topicMasteryModel
      .findOne({ userId, topicId })
      .exec();

    const newBestScore = existing
      ? Math.max(existing.bestScore, masteryScore)
      : masteryScore;
    const newMasteryLevel = this.scoreToMasteryLevel(newBestScore);

    await this.topicMasteryModel.findOneAndUpdate(
      { userId, topicId },
      {
        $set: { bestScore: newBestScore, masteryLevel: newMasteryLevel },
        $inc: { taughtCount: 1 },
      },
      { upsert: true },
    );
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
