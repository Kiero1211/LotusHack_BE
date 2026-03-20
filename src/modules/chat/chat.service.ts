import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
  ) {}

  /**
   * POST /chat — create a new chat session for a topic.
   * Returns the newly created Chat document.
   */
  async createChat(dto: CreateChatDto): Promise<Chat> {
    if (!Types.ObjectId.isValid(dto.topic_id)) {
      throw new BadRequestException('Invalid topic_id');
    }

    const topic = await this.topicModel.findById(dto.topic_id).exec();
    if (!topic) {
      throw new NotFoundException(`Topic ${dto.topic_id} not found`);
    }

    const chat = new this.chatModel({
      topicId: new Types.ObjectId(dto.topic_id),
      chatItems: [],
    });

    return chat.save();
  }

  /**
   * GET /topic/:topic_id/chat — return the most recent chat for a topic
   * with the topic populated and a feedback placeholder.
   */
  async getChatByTopicId(topicId: string): Promise<{
    topic: { id: string; title: string; description: string };
    chatItems: { role: string; content: string; timestamp: string }[];
    feedback: null;
    timestamp: string;
  }> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid topic_id');
    }

    const topic = await this.topicModel.findById(topicId).exec();
    if (!topic) {
      throw new NotFoundException(`Topic ${topicId} not found`);
    }

    // Get most recent chat or create a fresh placeholder
    let chat = await this.chatModel
      .findOne({ topicId: new Types.ObjectId(topicId) })
      .sort({ createdAt: -1 })
      .exec();

    if (!chat) {
      chat = await new this.chatModel({
        topicId: new Types.ObjectId(topicId),
        chatItems: [],
      }).save();
    }

    return {
      topic: {
        id: (topic._id as Types.ObjectId).toString(),
        title: topic.title,
        description: topic.description,
      },
      chatItems: (chat.chatItems ?? []).map((item) => ({
        role: item.role === 'assistant' ? 'Agent' : 'User',
        content: item.content,
        timestamp: item.timestamp?.toISOString() ?? new Date().toISOString(),
      })),
      feedback: null,
      timestamp: (chat as any).createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
