import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsModule } from '../chats/chats.module';
import { TopicsModule } from '../topics/topics.module';
import { FeedbacksController } from './feedbacks.controller';
import { FeedbacksService } from './feedbacks.service';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import { FeedbackAiService } from './services/feedback-ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
    ChatsModule,
    TopicsModule,
  ],
  controllers: [FeedbacksController],
  providers: [FeedbacksService, FeedbackAiService],
  exports: [FeedbacksService, MongooseModule],
})
export class FeedbacksModule {}
