import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { GetChatResponseDto } from './dto/get-chat-response.dto';
import { ListChatsQueryDto } from './dto/list-chats-query.dto';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async getChatById(chatId: string): Promise<GetChatResponseDto> {
    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException(`Chat not found: ${chatId}`);
    }

    return this.mapToResponseDto(chat);
  }

  async listChats(query: ListChatsQueryDto): Promise<GetChatResponseDto[]> {
    const filter: Record<string, unknown> = {};

    if (query.topicId) {
      filter.topicId = new Types.ObjectId(query.topicId);
    }

    const chats = await this.chatModel.find(filter).sort({ createdAt: -1 }).exec();

    return chats.map(chat => this.mapToResponseDto(chat));
  }

  private mapToResponseDto(chat: ChatDocument): GetChatResponseDto {
    return {
      chatId: chat._id.toString(),
      topicId: chat.topicId.toString(),
      chatItems: chat.chatItems.map(item => ({
        role: item.role,
        content: item.content,
        timestamp: item.timestamp,
      })),
      hasFeedback: !!chat.feedbackId,
      feedbackId: chat.feedbackId?.toString(),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}
