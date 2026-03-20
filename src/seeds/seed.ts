import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { SeedModule } from './seed.module';
import { User } from 'src/modules/users/schema/user.schema';
import { RefreshToken } from 'src/modules/auth/schemas/refresh-token.schema';
import { Topic } from 'src/modules/topics/schemas/topic.schema';
import { TopicMastery } from 'src/modules/topics/schemas/topic-mastery.schema';
import { Document } from 'src/modules/documents/schemas/document.schema';
import { TeachingSession } from 'src/modules/teaching-sessions/schemas/teaching-session.schema';
import { Chat } from 'src/modules/chat/schemas/chat.schema';
import { Feedback } from 'src/modules/feedbacks/schemas/feedback.schema';

import { seedUsers } from './user.seed';
import { seedTopics } from './topic.seed';
import { seedRefreshTokens } from './refresh-token.seed';
import { seedDocuments } from './document.seed';
import { seedChats } from './chat.seed';
import { seedFeedbacks } from './feedback.seed';
import { seedTopicMasteries } from './topic-mastery.seed';
import { seedTeachingSessions } from './teaching-session.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });

  try {
    console.log('Starting database seeding...\n');

    await seedUsers(app.get(getModelToken(User.name)));
    await seedTopics(app.get(getModelToken(Topic.name)));
    await seedRefreshTokens(app.get(getModelToken(RefreshToken.name)));
    await seedDocuments(app.get(getModelToken(Document.name)));
    await seedChats(app.get(getModelToken(Chat.name)));
    await seedFeedbacks(app.get(getModelToken(Feedback.name)));
    await seedTopicMasteries(app.get(getModelToken(TopicMastery.name)));
    await seedTeachingSessions(app.get(getModelToken(TeachingSession.name)));

    console.log('\nDatabase seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
