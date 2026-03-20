import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeachingSession } from '../teaching-sessions/schemas/teaching-session.schema';
import { TopicMastery } from '../topics/schemas/topic-mastery.schema';
import { DifficultyLevel, Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { User, UserDocument } from '../users/schema/user.schema';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

interface DifficultyData {
  difficulty: string;
  title: string;
  completionPercentage: number;
  topics: { id: string; title: string; masteryLevel: string; bestScore: number }[];
}

const DIFFICULTY_ORDER: Record<string, number> = {
  [DifficultyLevel.EASY]: 0,
  [DifficultyLevel.MEDIUM]: 1,
  [DifficultyLevel.HARD]: 2,
};

const DIFFICULTY_TITLES: Record<string, string> = {
  [DifficultyLevel.EASY]: 'Easy',
  [DifficultyLevel.MEDIUM]: 'Medium',
  [DifficultyLevel.HARD]: 'Hard',
};

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TopicMastery.name) private masteryModel: Model<TopicMastery>,
    @InjectModel(TeachingSession.name) private sessionModel: Model<TeachingSession>,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    let user: UserDocument | null = null;
    if (userId !== 'placeholder' && Types.ObjectId.isValid(userId)) {
      user = await this.userModel.findById(userId);
    } else {
      user = await this.userModel.findOne();
    }

    if (!user) {
      this.logger.warn(`User could not be loaded for dashboard: ${userId}`);
      return {
        welcome: { streak: 0, totalPoints: 0, topicsMastered: 0 },
        activeLearning: null,
        difficulties: [],
        recentActivity: [],
      };
    }

    // 1. Welcome Stats
    const welcome = {
      streak: user.currentStreak || 0,
      totalPoints: user.totalPoints || 0,
      topicsMastered: user.topicsMastered || 0,
    };

    // 2. Active Learning
    const lastSession = await this.sessionModel
      .findOne({ userId: user._id })
      .sort({ updatedAt: -1 })
      .exec();

    let activeLearning: DashboardSummaryDto['activeLearning'] = null;
    if (lastSession) {
      activeLearning = {
        difficulty: DifficultyLevel.EASY,
        progressPercentage: Math.min(lastSession.chatHistory?.length ?? 0, 10) * 10,
        nextTopic: {
          id: lastSession._id.toString(),
          title: `Next steps for ${lastSession.topic || lastSession.title}`,
        },
      };
    }

    // 3. Difficulties
    const masteries = await this.masteryModel
      .find({ userId: user._id })
      .populate<{ topicId: TopicDocument }>('topicId')
      .exec();

    const difficultyMap = new Map<string, DifficultyData>();

    for (const m of masteries) {
      if (!m.topicId) continue;
      const t = m.topicId;
      const diff = t.difficulty || DifficultyLevel.EASY;

      if (!difficultyMap.has(diff)) {
        difficultyMap.set(diff, {
          difficulty: diff,
          title: DIFFICULTY_TITLES[diff] || diff,
          completionPercentage: 0,
          topics: [],
        });
      }

      const d = difficultyMap.get(diff);
      if (d) {
        d.topics.push({
          id: t._id.toString(),
          title: t.title,
          masteryLevel: m.masteryLevel,
          bestScore: m.bestScore,
        });

        const totalScore = d.topics.reduce(
          (acc: number, curr: { bestScore: number }) => acc + curr.bestScore,
          0,
        );
        d.completionPercentage = Math.round(totalScore / d.topics.length);
      }
    }

    const difficulties = Array.from(difficultyMap.values()).sort(
      (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99),
    );

    // 4. Recent Activity
    const recentSessions = await this.sessionModel
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .exec();

    const recentActivity = recentSessions.map(s => {
      return {
        id: s._id.toString(),
        type: 'session_update',
        timeAgo: this.timeSince(s.updatedAt ?? new Date()),
        topicTitle: s.topic || s.title,
        masteryScore: 0,
      };
    });

    return {
      welcome,
      activeLearning,
      difficulties,
      recentActivity,
    };
  }

  private timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  }
}
