export class ChatItemDto {
  role: string;
  content: string;
  timestamp: Date;
}

export class GetChatResponseDto {
  chatId: string;
  sessionId: string;
  topicId: string;
  topicTitle?: string;
  chatItems: ChatItemDto[];
  hasFeedback: boolean;
  feedbackId?: string;
  createdAt: Date;
  updatedAt: Date;
}
