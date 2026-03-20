import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardListener } from './dashboard.listener';
import { TopicsModule } from '../topics/topics.module';
import { TeachingSessionsModule } from '../teaching-sessions/teaching-sessions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TopicsModule, TeachingSessionsModule, UsersModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardListener],
})
export class DashboardModule {}
