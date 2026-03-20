import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { User, UserDocument } from '../users/schema/user.schema';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { TopicMastery } from '../topics/schemas/topic-mastery.schema';
import {
  TeachingSession,
  SessionStatus,
} from '../teaching-sessions/schemas/teaching-session.schema';

interface PhaseData {
  phase: number;
  title: string;
  completionPercentage: number;
  topics: { id: string; title: string; masteryLevel: string; bestScore: number }[];
}

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
      // For testing purposes, fetch first user if placeholder is passed
      user = await this.userModel.findOne();
    }

    if (!user) {
      this.logger.warn(`User could not be loaded for dashboard: ${userId}`);
      // Return empty structure strictly matching DTO rather than 404 for dashboard robustness
      return {
        welcome: { streak: 0, totalPoints: 0, topicsMastered: 0 },
        activeLearning: null,
        phases: [],
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
      .populate('topicId')
      .exec();

    let activeLearning: DashboardSummaryDto['activeLearning'] = null;
    if (lastSession && lastSession.topicId) {
      const topic = lastSession.topicId as unknown as TopicDocument;
      activeLearning = {
        document: { id: topic.documentId?.toString() || 'doc1', filename: 'Current Document' },
        phase: topic.phase || 1,
        progressPercentage: lastSession.status === SessionStatus.COMPLETED ? 100 : 50,
        nextTopic: { id: topic._id.toString(), title: `Next steps for ${topic.title}` },
      };
    }

    // 3. Phases
    const masteries = await this.masteryModel
      .find({ userId: user._id })
      .populate<{ topicId: TopicDocument }>('topicId')
      .exec();

    const phasesMap = new Map<number, PhaseData>();

    for (const m of masteries) {
      if (!m.topicId) continue;
      const t = m.topicId;
      const phaseNum = t.phase || 1;

      if (!phasesMap.has(phaseNum)) {
        phasesMap.set(phaseNum, {
          phase: phaseNum,
          title: `Phase ${phaseNum}`,
          completionPercentage: 0,
          topics: [],
        });
      }

      const p = phasesMap.get(phaseNum);
      if (p) {
        p.topics.push({
          id: t._id.toString(),
          title: t.title,
          masteryLevel: m.masteryLevel,
          bestScore: m.bestScore,
        });

        const totalScore = p.topics.reduce(
          (acc: number, curr: { bestScore: number }) => acc + curr.bestScore,
          0,
        );
        p.completionPercentage = Math.round(totalScore / p.topics.length);
      }
    }

    const phases = Array.from(phasesMap.values()).sort((a, b) => a.phase - b.phase);

    // 4. Recent Activity
    const recentSessions = await this.sessionModel
      .find({ userId: user._id, status: SessionStatus.COMPLETED })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate<{ topicId: TopicDocument }>('topicId')
      .exec();

    const recentActivity = recentSessions.map(s => {
      const t = s.topicId;
      return {
        id: s._id.toString(),
        type: 'completed',
        timeAgo: s.completedAt ? this.timeSince(s.completedAt) : 'recently',
        topicTitle: t?.title || 'Unknown Topic',
        masteryScore: s.masteryScore || 0,
      };
    });

    return {
      welcome,
      activeLearning,
      phases,
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
