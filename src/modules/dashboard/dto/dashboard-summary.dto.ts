export class DashboardSummaryDto {
  welcome: {
    streak: number;
    totalPoints: number;
    topicsMastered: number;
  };
  activeLearning: {
    difficulty: string | null;
    progressPercentage: number | null;
    nextTopic: { id: string; title: string } | null;
  } | null;
  difficulties: {
    difficulty: string;
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
