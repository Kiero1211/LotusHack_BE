import { Controller, Delete, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { TOPIC_ROUTES } from 'src/common/constants/route';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopicsService } from './topics.service';

@Controller(TOPIC_ROUTES.BASE)
export class TopicController {
  constructor(private readonly topicsService: TopicsService) {}

  @Delete(TOPIC_ROUTES.BY_ID)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTopic(@Param('topicId') topicId: string): Promise<void> {
    await this.topicsService.deleteTopic(topicId);
  }
}
