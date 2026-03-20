import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { TopicMastery, MasteryLevel } from '../topics/schemas/topic-mastery.schema';
import { SessionCompletedEvent } from '../teaching-sessions/events/session-completed.event';

@Injectable()
export class DashboardListener {
  private readonly logger = new Logger(DashboardListener.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TopicMastery.name) private masteryModel: Model<TopicMastery>,
  ) {}

  @OnEvent('session.completed')
  async handleSessionCompletedEvent(payload: SessionCompletedEvent) {
    this.logger.log(`Handling session.completed event for user ${payload.userId}`);

    try {
      let mastery = await this.masteryModel.findOne({
        userId: new Types.ObjectId(payload.userId),
        topicId: new Types.ObjectId(payload.topicId),
      });

      let isNewMastery = false;
      let oldLevel: MasteryLevel | null = null;
      let topicsMasteredInc = 0;

      if (!mastery) {
        mastery = new this.masteryModel({
          userId: new Types.ObjectId(payload.userId),
          topicId: new Types.ObjectId(payload.topicId),
          bestScore: payload.masteryScore,
          masteryLevel: this.calculateMasteryLevel(payload.masteryScore),
        });
        isNewMastery = true;
      } else {
        oldLevel = mastery.masteryLevel;
        if (payload.masteryScore > mastery.bestScore) {
          mastery.bestScore = payload.masteryScore;
          mastery.masteryLevel = this.calculateMasteryLevel(payload.masteryScore);
        }
      }

      await mastery.save();

      const isNowMastered =
        mastery.masteryLevel === MasteryLevel.EXPERT ||
        mastery.masteryLevel === MasteryLevel.ADVANCED;
      const wasOldMastered = oldLevel === MasteryLevel.EXPERT || oldLevel === MasteryLevel.ADVANCED;

      if ((isNewMastery && isNowMastered) || (!isNewMastery && !wasOldMastered && isNowMastered)) {
        topicsMasteredInc = 1;
      }

      await this.userModel.updateOne(
        { _id: new Types.ObjectId(payload.userId) },
        {
          $inc: {
            currentStreak: 1,
            totalPoints: payload.masteryScore,
            topicsMastered: topicsMasteredInc,
          },
        },
      );
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to handle session.completed event: ${error.message}`, error.stack);
    }
  }

  private calculateMasteryLevel(score: number): MasteryLevel {
    if (score >= 90) return MasteryLevel.EXPERT;
    if (score >= 75) return MasteryLevel.ADVANCED;
    if (score >= 50) return MasteryLevel.INTERMEDIATE;
    return MasteryLevel.BEGINNER;
  }
}
