import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ChatTeachingSessionDto } from './dto/chat-teaching-session.dto';
import { CreateTeachingSessionDto } from './dto/create-teaching-session.dto';
import { ListTeachingSessionsDto } from './dto/list-teaching-sessions.dto';
import { PatchTeachingSessionDto } from './dto/patch-teaching-session.dto';
import { TeachingSessionsService } from './teaching-sessions.service';

const DEV_BYPASS_USER_ID = '64a1b2c3d4e5f6a7b8c9d001'; // Alice's seed ID

interface RequestWithUser extends ExpressRequest {
  user?: {
    userId?: string;
    email?: string;
  };
}

@Controller('teaching-sessions')
export class TeachingSessionsController {
  constructor(private readonly teachingSessionsService: TeachingSessionsService) {}

  private getRequestUserId(req: RequestWithUser): string {
    if (req.user?.userId) {
      return req.user.userId;
    }

    const ignoreAuth =
      process.env.IGNORE_SESSIONS_AUTH === 'true' ||
      process.env.NEXT_PUBLIC_IGNORE_SESSIONS_AUTH === 'true';

    if (ignoreAuth) {
      return DEV_BYPASS_USER_ID;
    }

    throw new UnauthorizedException('User not found in request');
  }

  @Get()
  async listSessions(@Request() req: RequestWithUser, @Query() query: ListTeachingSessionsDto) {
    const userId = this.getRequestUserId(req);

    if (query.user_id && query.user_id !== userId) {
      throw new ForbiddenException('You can only access your own teaching sessions');
    }

    return this.teachingSessionsService.listSessions(userId);
  }

  @Post()
  async createSession(@Request() req: RequestWithUser, @Body() dto: CreateTeachingSessionDto) {
    const userId = this.getRequestUserId(req);

    return this.teachingSessionsService.createSession(userId, dto);
  }

  @Get(':id')
  async getSession(@Request() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.getRequestUserId(req);

    return this.teachingSessionsService.getSessionById(userId, id);
  }

  @Patch(':id')
  async updateSession(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: PatchTeachingSessionDto,
  ) {
    const userId = this.getRequestUserId(req);

    return this.teachingSessionsService.updateSession(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSession(@Request() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.getRequestUserId(req);

    await this.teachingSessionsService.deleteSession(userId, id);
    return { success: true };
  }

  @Post(':id/chat')
  async chat(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ChatTeachingSessionDto,
  ) {
    const userId = this.getRequestUserId(req);

    const response = await this.teachingSessionsService.chatWithSession(userId, id, dto);
    return { response };
  }
}
