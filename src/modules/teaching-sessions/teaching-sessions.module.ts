import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeachingSessionsController } from './teaching-sessions.controller';
import { TeachingSessionsService } from './teaching-sessions.service';
import { TeachingSession, TeachingSessionSchema } from './schemas/teaching-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TeachingSession.name, schema: TeachingSessionSchema }]),
  ],
  controllers: [TeachingSessionsController],
  providers: [TeachingSessionsService],
  exports: [TeachingSessionsService, MongooseModule],
})
export class TeachingSessionsModule {}
