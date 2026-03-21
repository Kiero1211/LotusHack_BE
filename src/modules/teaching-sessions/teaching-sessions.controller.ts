import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import type { UserDocument } from 'src/modules/users/schema/user.schema';
import { ChatTeachingSessionDto } from './dto/chat-teaching-session.dto';
import { CreateTeachingSessionDto } from './dto/create-teaching-session.dto';
import { ListTeachingSessionsDto } from './dto/list-teaching-sessions.dto';
import { PatchTeachingSessionDto } from './dto/patch-teaching-session.dto';
import { TeachingSessionsService } from './teaching-sessions.service';

@Controller('teaching-sessions')
@UseGuards(JwtAuthGuard)
export class TeachingSessionsController {
  constructor(private readonly teachingSessionsService: TeachingSessionsService) {}

  @Get()
  async listSessions(@CurrentUser() user: UserDocument, @Query() query: ListTeachingSessionsDto) {
    const userId = user.id || user._id?.toString();

    if (query.user_id && query.user_id !== userId) {
      throw new ForbiddenException('You can only access your own teaching sessions');
    }

    return this.teachingSessionsService.listSessions(userId);
  }

  @Post()
  async createSession(@CurrentUser() user: UserDocument, @Body() dto: CreateTeachingSessionDto) {
    const userId = user.id || user._id?.toString();

    return this.teachingSessionsService.createSession(userId, dto);
  }

  @Get(':id')
  async getSession(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    const userId = user.id || user._id?.toString();

    return this.teachingSessionsService.getSessionById(userId, id);
  }

  @Patch(':id')
  async updateSession(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: PatchTeachingSessionDto,
  ) {
    const userId = user.id || user._id?.toString();

    return this.teachingSessionsService.updateSession(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSession(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    const userId = user.id || user._id?.toString();

    await this.teachingSessionsService.deleteSession(userId, id);
    return { success: true };
  }

  @Post(':id/chat')
  async chat(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: ChatTeachingSessionDto,
  ) {
    const userId = user.id || user._id?.toString();

    const response = await this.teachingSessionsService.chatWithSession(userId, id, dto);
    return { response };
  }
}
