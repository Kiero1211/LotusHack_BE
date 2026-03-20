import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document as MongooseDocument } from 'mongoose';

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ timestamps: true })
export class Topic extends MongooseDocument {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: DifficultyLevel, required: true })
  difficulty: DifficultyLevel;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
