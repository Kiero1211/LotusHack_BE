import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
  ) {}

  async upsert(dto: UpsertFeedbackDto): Promise<Feedback> {
    return this.feedbackModel.findOneAndUpdate(
      { topicId: new Types.ObjectId(dto.topicId) },
      {
        topicId: new Types.ObjectId(dto.topicId),
        masteryScore: dto.masteryScore,
        missedConcepts: dto.missedConcepts ?? [],
        strengthsHighlighted: dto.strengthsHighlighted,
        gentleSuggestions: dto.gentleSuggestions,
      },
      { upsert: true, new: true, runValidators: true },
    );
  }

  async findByTopicId(topicId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      topicId: new Types.ObjectId(topicId),
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback not found for topic ${topicId}`);
    }

    return feedback;
  }
}
