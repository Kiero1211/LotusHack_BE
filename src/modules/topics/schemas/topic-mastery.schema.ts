import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export enum MasteryLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
}

@Schema({ timestamps: true })
export class TopicMastery extends MongooseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: String, enum: MasteryLevel, default: MasteryLevel.BEGINNER })
  masteryLevel: MasteryLevel;

  @Prop({ type: Number, default: 0 })
  bestScore: number;

  @Prop({ type: Number, default: 0 })
  taughtCount: number;
}

export const TopicMasterySchema = SchemaFactory.createForClass(TopicMastery);
