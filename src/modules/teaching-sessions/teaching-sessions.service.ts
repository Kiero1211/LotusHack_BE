import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeachingSession, SessionStatus } from './schemas/teaching-session.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class TeachingSessionsService {
  private readonly logger = new Logger(TeachingSessionsService.name);

  constructor(
    @InjectModel(TeachingSession.name) private sessionModel: Model<TeachingSession>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createSession(userId: string, topicId: string): Promise<TeachingSession> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid topicId');
    }

    let finalUserId = userId;

    if (!Types.ObjectId.isValid(userId)) {
      if (userId === 'placeholder') {
        const firstUser = await this.userModel.findOne();
        if (firstUser) {
          finalUserId = firstUser._id.toString();
        } else {
          throw new BadRequestException('No users found to act as placeholder');
        }
      } else {
        throw new BadRequestException('Invalid userId');
      }
    }

    const existing = await this.sessionModel.findOne({
      userId: finalUserId,
      topicId,
      status: SessionStatus.IN_PROGRESS,
    });

    if (existing) {
      return existing;
    }

    const newSession = new this.sessionModel({
      userId: finalUserId,
      topicId,
      status: SessionStatus.IN_PROGRESS,
    });

    return newSession.save();
  }
}
