import { Controller, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { TeachingSessionsService } from './teaching-sessions.service';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    _id?: string;
  };
}

@Controller('api/v1/teaching-sessions')
export class TeachingSessionsController {
  constructor(private readonly teachingSessionsService: TeachingSessionsService) {}

  @Post()
  async createSession(
    @Req() req: RequestWithUser,
    @Body('topicId') topicId: string,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = req.user?.id || req.user?._id || bodyUserId || 'placeholder';
    
    if (!topicId) {
      throw new HttpException('topicId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.teachingSessionsService.createSession(userId.toString(), topicId);
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      throw new HttpException(
        error.message || 'Error creating teaching session',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
