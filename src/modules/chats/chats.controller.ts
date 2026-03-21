import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CHAT_ROUTES } from 'src/common/constants/route';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schema/user.schema';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetChatResponseDto } from './dto/get-chat-response.dto';
import { ListChatsQueryDto } from './dto/list-chats-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller(CHAT_ROUTES.BASE)
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async createChat(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateChatDto,
  ): Promise<GetChatResponseDto> {
    const userId = user.id || user._id?.toString();
    return this.chatsService.createChat(userId, dto);
  }

  @Get()
  async listChats(
    @CurrentUser() user: UserDocument,
    @Query() query: ListChatsQueryDto,
  ): Promise<GetChatResponseDto[]> {
    const userId = user.id || user._id?.toString();
    return this.chatsService.listChats(userId, query);
  }

  @Get(CHAT_ROUTES.BY_ID)
  async getChatById(
    @CurrentUser() user: UserDocument,
    @Param('chatId') chatId: string,
  ): Promise<GetChatResponseDto> {
    const userId = user.id || user._id?.toString();
    return this.chatsService.getChatById(userId, chatId);
  }

  @Post(CHAT_ROUTES.MESSAGES)
  async sendMessage(
    @CurrentUser() user: UserDocument,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ): Promise<{ response: string }> {
    const userId = user.id || user._id?.toString();
    const response = await this.chatsService.sendMessage(userId, chatId, dto);
    return { response };
  }

  @Delete(CHAT_ROUTES.BY_ID)
  @HttpCode(HttpStatus.OK)
  async deleteChat(
    @CurrentUser() user: UserDocument,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    const userId = user.id || user._id?.toString();
    await this.chatsService.deleteChat(userId, chatId);
    return { success: true };
  }
}
