import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { authConfig, databaseConfig, openaiConfig } from './common/configs';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './modules/database/database.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { TeachingSessionsModule } from './modules/teaching-sessions/teaching-sessions.module';
import { TopicsModule } from './modules/topics/topics.module';
import { UsersModule } from './modules/users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, authConfig, openaiConfig],
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    EventEmitterModule.forRoot(),
    DocumentsModule,
    AuthModule,
    ChatModule,
    TopicsModule,
    TeachingSessionsModule,
    DashboardModule,
    FeedbacksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
