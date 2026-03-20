import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsService } from './topics.service';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicMastery, TopicMasterySchema } from './schemas/topic-mastery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: TopicMastery.name, schema: TopicMasterySchema },
    ]),
  ],
  providers: [TopicsService],
  exports: [TopicsService, MongooseModule],
})
export class TopicsModule {}
