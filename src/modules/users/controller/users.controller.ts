import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { ChangePasswordDto } from '../dto/change-password.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }
}
