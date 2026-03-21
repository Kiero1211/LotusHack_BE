import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { TeachingSessionsModule } from '../teaching-sessions/teaching-sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    TeachingSessionsModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService, MongooseModule],
})
export class ChatsModule {}
