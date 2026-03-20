import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document as MongooseDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

export type ChatItem = {
  role: string;
  content: string;
  timestamp: Date;
};

@Schema({ timestamps: true })
export class Chat extends MongooseDocument {
  @Prop({
    type: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    required: true,
    default: [],
  })
  chatItems: ChatItem[];

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Feedback', required: false })
  feedbackId?: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
