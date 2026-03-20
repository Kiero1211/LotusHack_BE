import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from '../documents/documents.module';
import { TeachingSessionsModule } from '../teaching-sessions/teaching-sessions.module';
import { TopicsController } from './topics.controller';
import { TopicGeneration, TopicGenerationSchema } from './schemas/topic-generation.schema';
import { TopicsService } from './topics.service';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicMastery, TopicMasterySchema } from './schemas/topic-mastery.schema';
import { TopicAiService } from './services/topic-ai.service';

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
