import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetFeedbackQueryDto } from './dto/get-feedback-query.dto';
import { GetFeedbackResponseDto } from './dto/get-feedback-response.dto';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbacksService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>) {}

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
