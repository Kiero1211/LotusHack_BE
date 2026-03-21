import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CHAT_ROUTES } from 'src/common/constants/route';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { GetChatResponseDto } from './dto/get-chat-response.dto';
import { ListChatsQueryDto } from './dto/list-chats-query.dto';

@Controller(CHAT_ROUTES.BASE)
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async listChats(@Query() query: ListChatsQueryDto): Promise<GetChatResponseDto[]> {
    return this.chatsService.listChats(query);
  }

  @Get(CHAT_ROUTES.BY_ID)
  async getChatById(@Param('chatId') chatId: string): Promise<GetChatResponseDto> {
    return this.chatsService.getChatById(chatId);
  }
}
