import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbacksService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>) {}

  async upsert(dto: UpsertFeedbackDto): Promise<Feedback> {
    return this.feedbackModel.findOneAndUpdate(
      { chatId: new Types.ObjectId(dto.chatId) },
      {
        chatId: new Types.ObjectId(dto.chatId),
        masteryScore: dto.masteryScore,
        missedConcepts: dto.missedConcepts,
        strengthsHighlighted: dto.strengthsHighlighted,
        gentleSuggestions: dto.gentleSuggestions,
      },
      { upsert: true, new: true, runValidators: true },
    );
  }

  async findByChatId(chatId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      chatId: new Types.ObjectId(chatId),
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback not found for chat ${chatId}`);
    }

    return feedback;
  }

  async getNewestFeedback(chatId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      chatId: new Types.ObjectId(chatId),
    });

    if (!feedback) {
      throw new NotFoundException('No feedback found');
    }

    return feedback;
  }
}
