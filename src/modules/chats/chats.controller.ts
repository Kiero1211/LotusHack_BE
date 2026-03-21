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
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { CHAT_ROUTES } from 'src/common/constants/route';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetChatResponseDto } from './dto/get-chat-response.dto';
import { ListChatsQueryDto } from './dto/list-chats-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

const DEV_BYPASS_USER_ID = '64a1b2c3d4e5f6a7b8c9d001'; // Alice's seed ID

interface RequestWithUser extends ExpressRequest {
  user?: { userId?: string; email?: string };
}

@Controller(CHAT_ROUTES.BASE)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  private getUserId(req: RequestWithUser): string {
    if (req.user?.userId) return req.user.userId;

    const ignoreAuth =
      process.env.IGNORE_SESSIONS_AUTH === 'true' ||
      process.env.NEXT_PUBLIC_IGNORE_SESSIONS_AUTH === 'true';

    if (ignoreAuth) return DEV_BYPASS_USER_ID;

    throw new UnauthorizedException('User not found in request');
  }

  @Post()
  async createChat(
    @Request() req: RequestWithUser,
    @Body() dto: CreateChatDto,
  ): Promise<GetChatResponseDto> {
    const userId = this.getUserId(req);
    return this.chatsService.createChat(userId, dto);
  }

  @Get()
  async listChats(
    @Request() req: RequestWithUser,
    @Query() query: ListChatsQueryDto,
  ): Promise<GetChatResponseDto[]> {
    const userId = this.getUserId(req);
    return this.chatsService.listChats(userId, query);
  }

  @Get(CHAT_ROUTES.BY_ID)
  async getChatById(
    @Request() req: RequestWithUser,
    @Param('chatId') chatId: string,
  ): Promise<GetChatResponseDto> {
    const userId = this.getUserId(req);
    return this.chatsService.getChatById(userId, chatId);
  }

  @Post(CHAT_ROUTES.MESSAGES)
  async sendMessage(
    @Request() req: RequestWithUser,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ): Promise<{ response: string }> {
    const userId = this.getUserId(req);
    const response = await this.chatsService.sendMessage(userId, chatId, dto);
    return { response };
  }

  @Delete(CHAT_ROUTES.BY_ID)
  @HttpCode(HttpStatus.OK)
  async deleteChat(
    @Request() req: RequestWithUser,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    const userId = this.getUserId(req);
    await this.chatsService.deleteChat(userId, chatId);
    return { success: true };
  }
}
