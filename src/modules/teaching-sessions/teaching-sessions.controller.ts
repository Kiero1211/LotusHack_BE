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
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatTeachingSessionDto } from './dto/chat-teaching-session.dto';
import { CreateTeachingSessionDto } from './dto/create-teaching-session.dto';
import { ListTeachingSessionsDto } from './dto/list-teaching-sessions.dto';
import { PatchTeachingSessionDto } from './dto/patch-teaching-session.dto';
import { TeachingSessionsService } from './teaching-sessions.service';

interface RequestWithUser extends ExpressRequest {
  user?: {
    userId?: string;
    email?: string;
  };
}

@Controller('api/v1/teaching-sessions')
@UseGuards(JwtAuthGuard)
export class TeachingSessionsController {
  constructor(private readonly teachingSessionsService: TeachingSessionsService) {}

  @Get()
  async listSessions(@Request() req: RequestWithUser, @Query() query: ListTeachingSessionsDto) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    if (query.user_id && query.user_id !== userId) {
      throw new ForbiddenException('You can only access your own teaching sessions');
    }

    return this.teachingSessionsService.listSessions(userId);
  }

  @Post()
  async createSession(@Request() req: RequestWithUser, @Body() dto: CreateTeachingSessionDto) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.teachingSessionsService.createSession(userId, dto);
  }

  @Get(':id')
  async getSession(@Request() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.teachingSessionsService.getSessionById(userId, id);
  }

  @Patch(':id')
  async updateSession(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: PatchTeachingSessionDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.teachingSessionsService.updateSession(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSession(@Request() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    await this.teachingSessionsService.deleteSession(userId, id);
    return { success: true };
  }

  @Post(':id/chat')
  async chat(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ChatTeachingSessionDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    const response = await this.teachingSessionsService.chatWithSession(userId, id, dto);
    return { response };
  }
}
