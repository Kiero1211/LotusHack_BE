import { Controller, Get, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    _id?: string;
    userId?: string;
  };
}

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary(@Req() req: RequestWithUser): Promise<DashboardSummaryDto> {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    try {
      // In a real scenario, use userId. For testing with no auth, we might mock this inside service
      return await this.dashboardService.getSummary(userId || 'placeholder');
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      throw new HttpException(
        error.message || 'Error fetching dashboard summary',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
