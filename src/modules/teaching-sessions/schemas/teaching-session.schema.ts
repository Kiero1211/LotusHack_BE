import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

@Schema({ _id: false })
export class SourceItem {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  type: string;
}

@Schema({ _id: false })
export class ChatMessageItem {
  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: ChatRole;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class TeachingSession extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  topic?: string;

  @Prop({ type: [SourceItem], default: [] })
  sources: SourceItem[];

  @Prop({ type: [ChatMessageItem], default: [] })
  chatHistory: ChatMessageItem[];

  @Prop({ type: String })
  summary?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Source {
  title: string;
  content: string;
  type: string;
}

export interface Message {
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface Session {
  userId: Types.ObjectId;
  title: string;
  topic?: string;
  sources: Source[];
  chatHistory: Message[];
  summary?: string;
}

export const TeachingSessionSchema = SchemaFactory.createForClass(TeachingSession);
