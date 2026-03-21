import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FEEDBACK_ROUTES } from 'src/common/constants/route';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateFeedbackDto } from './dto/generate-feedback.dto';
import { GetFeedbackQueryDto } from './dto/get-feedback-query.dto';
import { GetFeedbackResponseDto } from './dto/get-feedback-response.dto';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { FeedbacksService } from './feedbacks.service';

@Controller(FEEDBACK_ROUTES.BASE)
@UseGuards(JwtAuthGuard)
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  async getFeedback(
    @Query() query: GetFeedbackQueryDto,
    @Headers('x-locale') locale?: string,
  ): Promise<GetFeedbackResponseDto> {
    return this.feedbacksService.findByQuery(query, locale);
  }

  @Get(FEEDBACK_ROUTES.BY_ID)
  async getFeedbackById(@Param('feedbackId') feedbackId: string): Promise<GetFeedbackResponseDto> {
    return this.feedbacksService.findById(feedbackId);
  }

  @Post()
  async upsert(@Body() dto: UpsertFeedbackDto): Promise<GetFeedbackResponseDto> {
    return this.feedbacksService.upsert(dto);
  }

  @Post(FEEDBACK_ROUTES.GENERATE)
  async generateFeedback(
    @Body() dto: GenerateFeedbackDto,
    @Headers('x-locale') locale?: string,
  ): Promise<GetFeedbackResponseDto> {
    return this.feedbacksService.generateFeedback(dto.chatId, locale);
  }
}
