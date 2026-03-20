import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeachingSessionsController } from './teaching-sessions.controller';
import { TeachingSessionsService } from './teaching-sessions.service';
import { TeachingSession, TeachingSessionSchema } from './schemas/teaching-session.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TeachingSession.name, schema: TeachingSessionSchema }]),
    UsersModule,
  ],
  controllers: [TeachingSessionsController],
  providers: [TeachingSessionsService],
  exports: [TeachingSessionsService, MongooseModule],
})
export class TeachingSessionsModule {}
