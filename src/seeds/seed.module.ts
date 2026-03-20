import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from 'src/common/configs';

import { User, UserSchema } from 'src/modules/users/schema/user.schema';
import { RefreshToken, RefreshTokenSchema } from 'src/modules/auth/schemas/refresh-token.schema';
import { Topic, TopicSchema } from 'src/modules/topics/schemas/topic.schema';
import { TopicMastery, TopicMasterySchema } from 'src/modules/topics/schemas/topic-mastery.schema';
import { Document, DocumentSchema } from 'src/modules/documents/schemas/document.schema';
import { TeachingSession, TeachingSessionSchema } from 'src/modules/teaching-sessions/schemas/teaching-session.schema';
import { Chat, ChatSchema } from 'src/modules/chat/schemas/chat.schema';
import { Feedback, FeedbackSchema } from 'src/modules/feedbacks/schemas/feedback.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: TopicMastery.name, schema: TopicMasterySchema },
      { name: Document.name, schema: DocumentSchema },
      { name: TeachingSession.name, schema: TeachingSessionSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
})
export class SeedModule {}
