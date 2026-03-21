export class GetFeedbackResponseDto {
  feedbackId: string;
  chatId: string;
  masteryScore: number;
  missedConcepts: string[];
  strengthsHighlighted: string[];
  gentleSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}
