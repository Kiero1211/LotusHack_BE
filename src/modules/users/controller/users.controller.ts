import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { UserDocument } from '../schema/user.schema';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id || user._id.toString(), changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ping')
  async ping() {
    return { message: 'pong' };
  }
}
