import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export enum SessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class TeachingSession extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.IN_PROGRESS })
  status: SessionStatus;

  @Prop({ type: Number, default: 0 })
  masteryScore: number;

  @Prop({ type: Date })
  completedAt: Date;
}

export const TeachingSessionSchema = SchemaFactory.createForClass(TeachingSession);
