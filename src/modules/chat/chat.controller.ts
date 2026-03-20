import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /api/chat
   * Body: { topic_id: string }
   * Creates a new chat session for the given topic.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createChat(@Body() dto: CreateChatDto) {
    const chat = await this.chatService.createChat(dto);
    return { chat_id: (chat as any)._id?.toString(), topic_id: dto.topic_id };
  }

  /**
   * GET /api/topic/:topic_id/chat
   * Returns the latest chat for the topic (creates one if none exists).
   */
  @Get('/topic/:topic_id/chat')
  async getChatByTopicId(@Param('topic_id') topicId: string) {
    return this.chatService.getChatByTopicId(topicId);
  }
}
