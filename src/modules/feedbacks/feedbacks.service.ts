import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbacksService {
  constructor(@InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>) {}

  async upsert(dto: UpsertFeedbackDto): Promise<Feedback> {
    return this.feedbackModel.create({
      topicId: new Types.ObjectId(dto.topicId),
      masteryScore: dto.masteryScore,
      missedConcepts: dto.missedConcepts,
      strengthsHighlighted: dto.strengthsHighlighted,
      gentleSuggestions: dto.gentleSuggestions,
    });
  }

  async findByTopicId(topicId: string): Promise<Feedback[]> {
    return this.feedbackModel
      .find({
        topicId: new Types.ObjectId(topicId),
      })
      .sort({ createdAt: -1 });
  }

  async getNewestFeedback(topicId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel
      .findOne({ topicId: new Types.ObjectId(topicId) })
      .sort({ createdAt: -1 });

    if (!feedback) {
      throw new NotFoundException('No feedback found');
    }

    return feedback;
  }
}
