import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { GENERATE_TOPIC_ROUTES } from 'src/common/constants/route';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { UserDocument } from 'src/modules/users/schema/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateTopicRequestDto } from './dto/generate-topic-request.dto';
import { TopicsService } from './topics.service';

interface AuthRequest extends ExpressRequest {
  user?: { userId?: string; sub?: string; id?: string; email?: string };
}

@Controller(GENERATE_TOPIC_ROUTES.BASE)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post(GENERATE_TOPIC_ROUTES.BY_TEACHING_SESSION)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async generateTopics(
    @CurrentUser() user: UserDocument,
    @Param('teachingSessionId') teachingSessionId: string,
    @Body() body: GenerateTopicRequestDto,
  ) {
    const userId = user._id.toString();
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.topicsService.startGeneration({
      userId,
      teachingSessionId,
      documentIds: body.documentIds,
    });
  }

  @Get(GENERATE_TOPIC_ROUTES.BY_TEACHING_SESSION)
  @UseGuards(JwtAuthGuard)
  async getGenerationStatus(
    @CurrentUser() user: UserDocument,
    @Param('teachingSessionId') teachingSessionId: string,
  ) {
    const userId = user._id.toString();
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return this.topicsService.getGenerationStatus(userId, teachingSessionId);
  }
}
