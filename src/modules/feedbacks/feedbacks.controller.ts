import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FEEDBACK_ROUTES } from 'src/common/constants/route';
import { UpsertFeedbackDto } from './dto/upsert-feedback.dto';
import { FeedbacksService } from './feedbacks.service';

@Controller(FEEDBACK_ROUTES.BASE)
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  async upsert(@Body() dto: UpsertFeedbackDto) {
    return this.feedbacksService.upsert(dto);
  }

  @Get(FEEDBACK_ROUTES.BY_TOPIC)
  async findByTopicId(@Param('topicId') topicId: string) {
    return this.feedbacksService.findByTopicId(topicId);
  }

  @Get(FEEDBACK_ROUTES.NEWEST)
  async getNewestFeedback(@Param('topicId') topicId: string) {
    return this.feedbacksService.getNewestFeedback(topicId);
  }
}
