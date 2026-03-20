export class DashboardSummaryDto {
  welcome: {
    streak: number;
    totalPoints: number;
    topicsMastered: number;
  };
  activeLearning: {
    document: { id: string; filename: string } | null;
    phase: number | null;
    progressPercentage: number | null;
    nextTopic: { id: string; title: string } | null;
  } | null;
  phases: {
    phase: number;
    title: string;
    completionPercentage: number;
    topics: { id: string; title: string; masteryLevel: string; bestScore: number }[];
  }[];
  recentActivity: {
    id: string;
    type: string;
    timeAgo: string;
    topicTitle: string;
    masteryScore: number;
  }[];
}
