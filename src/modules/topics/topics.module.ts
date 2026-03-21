import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from '../documents/documents.module';
import { TeachingSessionsModule } from '../teaching-sessions/teaching-sessions.module';
import { TopicGeneration, TopicGenerationSchema } from './schemas/topic-generation.schema';
import { TopicMastery, TopicMasterySchema } from './schemas/topic-mastery.schema';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicAiService } from './services/topic-ai.service';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [
    DocumentsModule,
    TeachingSessionsModule,
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: TopicMastery.name, schema: TopicMasterySchema },
      { name: TopicGeneration.name, schema: TopicGenerationSchema },
    ]),
  ],
  controllers: [TopicsController],
  providers: [TopicsService, TopicAiService],
  exports: [TopicsService, MongooseModule],
})
export class TopicsModule {}
