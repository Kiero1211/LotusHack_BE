import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document as MongooseDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

export type ChatItem = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

@Schema({ timestamps: true })
export class Chat extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeachingSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: String })
  topicTitle?: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  chatItems: ChatItem[];

  @Prop({ type: Types.ObjectId, ref: 'Feedback', required: false })
  feedbackId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
